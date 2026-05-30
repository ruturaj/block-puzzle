// Web-worker solver for the wooden block puzzle.
// Message in:  { type: 'solve', board: {rows, cols}, pieces: [{id, color, shape}], maxSolutions, uniqueUpTo }
// Messages out:
//   { type: 'progress', explored: number }
//   { type: 'solution', placements: [{id, row, col, shape}] }
//   { type: 'done', count: number, explored: number, reason: 'limit'|'exhausted'|'stopped'|'invalid' }
//   { type: 'error', message }

let stopRequested = false;

self.onmessage = (e) => {
  const msg = e.data;
  if (msg.type === 'stop') { stopRequested = true; return; }
  if (msg.type === 'solve') {
    stopRequested = false;
    try { run(msg); } catch (err) { self.postMessage({ type: 'error', message: err.message }); }
  }
};

// ---- geometry ----
function rotateCW(s) {
  const h = s.length, w = s[0].length;
  const out = Array.from({ length: w }, () => Array(h).fill(0));
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) out[c][h - 1 - r] = s[r][c];
  return out;
}
function flipH(s) { return s.map(r => r.slice().reverse()); }
function trim(s) {
  let top = 0, bot = s.length - 1, l = 0, r = s[0].length - 1;
  const re = (r) => s[r].every(v => !v);
  const ce = (c) => s.every(row => !row[c]);
  while (top <= bot && re(top)) top++;
  while (bot >= top && re(bot)) bot--;
  if (top > bot) return [[0]];
  while (l <= r && ce(l)) l++;
  while (r >= l && ce(r)) r--;
  const out = [];
  for (let i = top; i <= bot; i++) out.push(s[i].slice(l, r + 1));
  return out;
}
function key(s) { return s.map(r => r.join('')).join('/'); }
function orientations(shape) {
  const seen = new Set();
  const out = [];
  let s = shape.map(r => r.slice());
  for (let f = 0; f < 2; f++) {
    let cur = s;
    for (let i = 0; i < 4; i++) {
      const t = trim(cur);
      const k = key(t);
      if (!seen.has(k)) { seen.add(k); out.push(t); }
      cur = rotateCW(cur);
    }
    s = flipH(s);
  }
  return out;
}
function cellCount(s) { let n = 0; for (const r of s) for (const v of r) if (v) n++; return n; }

// ---- solver ----
function run({ board, pieces, maxSolutions }) {
  const ROWS = board.rows, COLS = board.cols;
  const TARGET = ROWS * COLS;

  const validPieces = pieces.filter(p => cellCount(trim(p.shape)) > 0);
  const sum = validPieces.reduce((s, p) => s + cellCount(trim(p.shape)), 0);
  if (sum > TARGET) {
    self.postMessage({
      type: 'done', count: 0, explored: 0, reason: 'invalid',
      detail: `Piece cells sum to ${sum} but board only has ${TARGET}. Remove or shrink pieces.`
    });
    return;
  }
  const emptyAllowed = TARGET - sum; // number of cells that will remain empty

  // Pre-compute orientations per piece.
  const pieceOris = validPieces.map(p => ({
    id: p.id, color: p.color,
    oris: orientations(p.shape),
  }));

  // Board as flat Int8Array of pieceIndex+1, 0 = empty.
  const grid = new Int8Array(ROWS * COLS);
  // -1 = explicitly skipped empty (cannot be used by future pieces), 0 = empty, >0 = piece+1
  const used = new Uint8Array(pieceOris.length);
  const placements = [];
  let usedCount = 0;
  let skippedCount = 0;

  let explored = 0;
  let found = 0;
  let lastReport = 0;
  const solutions = new Set(); // dedupe via canonical fingerprint

  function findEmpty() {
    for (let i = 0; i < grid.length; i++) if (!grid[i]) return i;
    return -1;
  }

  function canPlace(shape, row, col) {
    const h = shape.length, w = shape[0].length;
    if (row + h > ROWS || col + w > COLS || row < 0 || col < 0) return false;
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      if (!shape[r][c]) continue;
      if (grid[(row + r) * COLS + (col + c)]) return false;
    }
    return true;
  }
  function apply(shape, row, col, val) {
    const h = shape.length, w = shape[0].length;
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      if (shape[r][c]) grid[(row + r) * COLS + (col + c)] = val;
    }
  }

  function emitSolution() {
    // Canonical fingerprint: each cell -> piece id index (or 0 for empty).
    // Normalize -1 (skipped) to 0 for the fingerprint so equivalent layouts dedupe.
    const norm = new Int8Array(grid.length);
    for (let i = 0; i < grid.length; i++) norm[i] = grid[i] > 0 ? grid[i] : 0;
    const fp = Array.from(norm).join(',');
    if (solutions.has(fp)) return;
    solutions.add(fp);
    found++;
    const out = placements.map(p => ({
      id: pieceOris[p.pieceIndex].id,
      color: pieceOris[p.pieceIndex].color,
      row: p.row, col: p.col, shape: p.shape,
    }));
    self.postMessage({ type: 'solution', placements: out, index: found });
  }

  function dfs() {
    if (stopRequested) return true;
    if (found >= maxSolutions) return true;

    explored++;
    if (explored - lastReport >= 5000) {
      lastReport = explored;
      self.postMessage({ type: 'progress', explored, found });
    }

    // Done when every piece is placed (empties don't matter).
    if (usedCount === pieceOris.length) {
      emitSolution();
      return found >= maxSolutions;
    }

    const idx = findEmpty();
    if (idx < 0) {
      // Board full but not all pieces used -> not a solution.
      return false;
    }
    const row = (idx / COLS) | 0;
    const col = idx % COLS;

    for (let pi = 0; pi < pieceOris.length; pi++) {
      if (used[pi]) continue;
      const oris = pieceOris[pi].oris;
      for (let oi = 0; oi < oris.length; oi++) {
        const shape = oris[oi];
        for (let dr = 0; dr < shape.length; dr++) {
          for (let dc = 0; dc < shape[0].length; dc++) {
            if (!shape[dr][dc]) continue;
            const r0 = row - dr, c0 = col - dc;
            if (!canPlace(shape, r0, c0)) continue;
            apply(shape, r0, c0, pi + 1);
            used[pi] = 1; usedCount++;
            placements.push({ pieceIndex: pi, row: r0, col: c0, shape });
            const stop = dfs();
            placements.pop();
            used[pi] = 0; usedCount--;
            apply(shape, r0, c0, 0);
            if (stop) return true;
          }
        }
      }
    }

    // No piece covers this cell. We may leave it empty if we still have
    // empty-slack remaining.
    if (skippedCount < emptyAllowed) {
      grid[idx] = -1;
      skippedCount++;
      const stop = dfs();
      grid[idx] = 0;
      skippedCount--;
      if (stop) return true;
    }
    return false;
  }

  dfs();
  const reason =
    stopRequested ? 'stopped'
    : found >= maxSolutions ? 'limit'
    : 'exhausted';
  self.postMessage({ type: 'done', count: found, explored, reason });
}
