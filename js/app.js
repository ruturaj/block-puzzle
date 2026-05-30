import {
  PIECE_COLORS,
  BOARD_COLS,
  BOARD_ROWS,
  loadShapes,
  setShape,
  getShape,
  resetAll,
  exportJSON,
  importJSON,
  cloneShape,
  cellCount,
  trimShape,
  rotateCW,
  flipH,
  totalCells,
  getPieces,
  emptyShape,
} from './pieces.js';

// =====================================================================
// Tabs
// =====================================================================
const tabs = document.querySelectorAll('.tab');
tabs.forEach((t) =>
  t.addEventListener('click', () => {
    tabs.forEach((x) => x.classList.toggle('active', x === t));
    document.querySelectorAll('.view').forEach((v) => {
      v.classList.toggle('active', v.id === `view-${t.dataset.view}`);
    });
    if (t.dataset.view === 'inspector') buildInspector();
    if (t.dataset.view === 'solver') rebuildSolverTray();
  })
);

// =====================================================================
// Header meta + dims labels
// =====================================================================
const target = BOARD_COLS * BOARD_ROWS;
document.getElementById('target-cells-edit').textContent = `${target}`;
document.getElementById('board-dims-edit').textContent = `${BOARD_COLS} × ${BOARD_ROWS}`;
document.getElementById('board-dims').textContent = `${BOARD_COLS} × ${BOARD_ROWS}`;

function updateMeta() {
  const sum = totalCells();
  document.getElementById('meta').innerHTML = `
    Board: ${BOARD_COLS}×${BOARD_ROWS} = ${target} cells &nbsp;|&nbsp;
    Pieces sum: <strong style="color:${sum === target ? '#2ecc71' : '#e74c3c'}">${sum}</strong>
    ${sum === target ? '✓ matches' : `(off by ${sum - target})`}
  `;
}

// =====================================================================
// Generic small-grid renderer (read-only)
// =====================================================================
function renderPieceGrid(shape, color, cellPx = 22, extraClass = '') {
  const h = shape.length;
  const w = shape[0].length;
  const grid = document.createElement('div');
  grid.className = `piece-grid ${extraClass}`.trim();
  grid.style.gridTemplateColumns = `repeat(${w}, ${cellPx}px)`;
  grid.style.gridAutoRows = `${cellPx}px`;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell' + (shape[r][c] ? ' on' : '');
      if (shape[r][c]) cell.style.background = color;
      grid.appendChild(cell);
    }
  }
  return grid;
}

// =====================================================================
// EDITOR view — click cells to toggle, resize buttons per piece
// =====================================================================
const $editor = document.getElementById('editor-gallery');

function renderEditorGrid(piece) {
  const shape = getShape(piece.id);
  const h = shape.length;
  const w = shape[0].length;
  const cellPx = 26;
  const grid = document.createElement('div');
  grid.className = 'piece-grid editor-grid';
  grid.style.gridTemplateColumns = `repeat(${w}, ${cellPx}px)`;
  grid.style.gridAutoRows = `${cellPx}px`;

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell' + (shape[r][c] ? ' on' : '');
      if (shape[r][c]) cell.style.background = piece.color;
      cell.addEventListener('click', () => {
        const s = getShape(piece.id);
        const val = s[r][c] ? 0 : 1;
        s[r][c] = val;
        setShape(piece.id, s);
        cell.classList.toggle('on', !!val);
        cell.style.background = val ? piece.color : '';
        updateMeta();
        updateCountLabel(piece.id);
      });
      grid.appendChild(cell);
    }
  }
  return grid;
}

function updateCountLabel(pieceId) {
  const el = document.querySelector(`[data-count-for="${pieceId}"]`);
  if (el) el.textContent = `${cellCount(getShape(pieceId))} cells`;
}

function buildEditor() {
  $editor.innerHTML = '';
  for (const p of PIECE_COLORS) {
    const card = document.createElement('div');
    card.className = 'piece-card';
    card.dataset.pieceId = p.id;

    const shape = getShape(p.id);
    const h = shape.length;
    const w = shape[0].length;

    card.innerHTML = `
      <h3>
        <span class="swatch" style="background:${p.color}"></span>${p.name}
        <span class="count" data-count-for="${p.id}">${cellCount(shape)} cells</span>
      </h3>
    `;
    card.appendChild(renderEditorGrid(p));

    const meta = document.createElement('div');
    meta.className = 'meta-row';
    meta.innerHTML = `<span>${h} × ${w}</span>`;
    card.appendChild(meta);

    const size = document.createElement('div');
    size.className = 'size-controls';
    size.innerHTML = `
      <button data-act="row-">−row</button>
      <button data-act="row+">+row</button>
      <button data-act="col-">−col</button>
      <button data-act="col+">+col</button>
      <button data-act="clear">clear</button>
    `;
    size.addEventListener('click', (e) => {
      const act = e.target?.dataset?.act;
      if (!act) return;
      resizeShape(p.id, act);
      rebuildOneCard(p.id);
    });
    card.appendChild(size);

    $editor.appendChild(card);
  }
}

function rebuildOneCard(pieceId) {
  const old = document.querySelector(`.piece-card[data-piece-id="${pieceId}"]`);
  if (!old) return;
  const piece = PIECE_COLORS.find((p) => p.id === pieceId);
  // re-render the same card in place
  const next = old.cloneNode(false);
  next.dataset.pieceId = pieceId;
  const shape = getShape(pieceId);
  next.innerHTML = `
    <h3>
      <span class="swatch" style="background:${piece.color}"></span>${piece.name}
      <span class="count" data-count-for="${piece.id}">${cellCount(shape)} cells</span>
    </h3>
  `;
  next.appendChild(renderEditorGrid(piece));
  const meta = document.createElement('div');
  meta.className = 'meta-row';
  meta.innerHTML = `<span>${shape.length} × ${shape[0].length}</span>`;
  next.appendChild(meta);
  const size = document.createElement('div');
  size.className = 'size-controls';
  size.innerHTML = `
    <button data-act="row-">−row</button>
    <button data-act="row+">+row</button>
    <button data-act="col-">−col</button>
    <button data-act="col+">+col</button>
    <button data-act="clear">clear</button>
  `;
  size.addEventListener('click', (e) => {
    const act = e.target?.dataset?.act;
    if (!act) return;
    resizeShape(pieceId, act);
    rebuildOneCard(pieceId);
  });
  next.appendChild(size);
  old.replaceWith(next);
  updateMeta();
}

function resizeShape(pieceId, act) {
  let s = getShape(pieceId).map((r) => r.slice());
  const h = s.length, w = s[0].length;
  if (act === 'row+') s.push(Array(w).fill(0));
  else if (act === 'row-' && h > 1) s.pop();
  else if (act === 'col+') s = s.map((r) => [...r, 0]);
  else if (act === 'col-' && w > 1) s = s.map((r) => r.slice(0, -1));
  else if (act === 'clear') s = emptyShape(h, w);
  setShape(pieceId, s);
}

// Editor toolbar
document.getElementById('btn-reset-all').addEventListener('click', () => {
  if (!confirm('Erase all piece shapes?')) return;
  resetAll();
  buildEditor();
  updateMeta();
});
document.getElementById('btn-export').addEventListener('click', () => {
  document.getElementById('io-text').value = exportJSON();
});
document.getElementById('btn-import').addEventListener('click', () => {
  const text = document.getElementById('io-text').value.trim();
  if (!text) return;
  try {
    importJSON(text);
    buildEditor();
    updateMeta();
    flashSaveStatus('Imported from text.');
  } catch (e) {
    alert('Invalid JSON: ' + e.message);
  }
});

// ----- Save / Load to local file -------------------------------------
function flashSaveStatus(msg) {
  const el = document.getElementById('save-status');
  el.textContent = msg;
  setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 4000);
}

document.getElementById('btn-save-file').addEventListener('click', () => {
  const json = exportJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `pentomino-pieces-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  flashSaveStatus(`Saved ${a.download}`);
});

const $fileInput = document.getElementById('file-input');
document.getElementById('btn-load-file').addEventListener('click', () => $fileInput.click());
$fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    importJSON(text);
    buildEditor();
    updateMeta();
    flashSaveStatus(`Loaded ${file.name}`);
  } catch (err) {
    alert('Failed to load file: ' + err.message);
  } finally {
    $fileInput.value = '';
  }
});

// =====================================================================
// INSPECTOR view
// =====================================================================
function buildInspector() {
  const gallery = document.getElementById('piece-gallery');
  gallery.innerHTML = '';
  for (const p of getPieces()) {
    const card = document.createElement('div');
    card.className = 'piece-card';
    const empty = cellCount(p.shape) === 0;
    const shape = empty ? [[0]] : p.shape;
    card.innerHTML = `
      <h3>
        <span class="swatch" style="background:${p.color}"></span>${p.name}
        <span class="count">${cellCount(p.shape)} cells</span>
      </h3>
    `;
    card.appendChild(renderPieceGrid(shape, p.color, 22));
    const meta = document.createElement('div');
    meta.className = 'meta-row';
    if (empty) meta.innerHTML = `<span style="color:#e74c3c">empty — define in editor</span>`;
    else meta.innerHTML = `<span>${shape.length} × ${shape[0].length}</span>`;
    card.appendChild(meta);
    gallery.appendChild(card);
  }
}

// =====================================================================
// SOLVER view
// =====================================================================
const board = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
const placements = Object.fromEntries(PIECE_COLORS.map((p) => [p.id, null]));

let held = null;
let hoverCell = null;

const $tray = document.getElementById('tray-pieces');
const $board = document.getElementById('board');
const $held = document.getElementById('held-preview');
const $status = document.getElementById('status');
const $btnRotate = document.getElementById('btn-rotate');
const $btnFlip = document.getElementById('btn-flip');
const $btnCancel = document.getElementById('btn-cancel');
const $btnResetBoard = document.getElementById('btn-reset-board');

function rebuildSolverTray() {
  $tray.innerHTML = '';
  for (const p of getPieces()) {
    const tile = document.createElement('div');
    tile.className = 'tray-piece';
    tile.dataset.id = p.id;
    const empty = cellCount(p.shape) === 0;
    tile.appendChild(renderPieceGrid(empty ? [[0]] : p.shape, p.color, 14));
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = p.name + (empty ? ' (empty)' : '');
    tile.appendChild(label);
    if (empty) tile.classList.add('empty');
    else tile.addEventListener('click', () => pickFromTray(p.id));
    $tray.appendChild(tile);
  }
  refreshTray();
}

function buildBoard() {
  $board.innerHTML = '';
  $board.style.gridTemplateColumns = `repeat(${BOARD_COLS}, var(--cell))`;
  $board.style.gridAutoRows = `var(--cell)`;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.addEventListener('mouseenter', () => onHover(r, c));
      cell.addEventListener('mouseleave', () => onHover(null));
      cell.addEventListener('click', () => onClickCell(r, c));
      $board.appendChild(cell);
    }
  }
}

function refreshTray() {
  for (const tile of $tray.children) {
    const id = tile.dataset.id;
    tile.classList.toggle('placed', !!placements[id]);
    tile.classList.toggle('held', held && held.piece.id === id);
  }
}

function refreshHeldPreview() {
  $held.innerHTML = '';
  if (!held) {
    $held.classList.add('empty');
    [$btnRotate, $btnFlip, $btnCancel].forEach((b) => (b.disabled = true));
    return;
  }
  $held.classList.remove('empty');
  $held.appendChild(renderPieceGrid(held.shape, held.piece.color, 18));
  [$btnRotate, $btnFlip, $btnCancel].forEach((b) => (b.disabled = false));
}

function refreshBoard() {
  for (const cell of $board.children) {
    cell.className = 'cell';
    cell.style.background = '';
    cell.style.boxShadow = '';
    cell.title = '';
    delete cell.dataset.pieceId;
  }
  for (const p of PIECE_COLORS) {
    const pl = placements[p.id];
    if (!pl) continue;
    const { row, col, shape } = pl;
    const h = shape.length;
    const w = shape[0].length;
    const isOn = (r, c) => r >= 0 && r < h && c >= 0 && c < w && !!shape[r][c];
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (!shape[r][c]) continue;
        const idx = (row + r) * BOARD_COLS + (col + c);
        const cell = $board.children[idx];
        cell.classList.add('filled');
        cell.style.background = p.color;
        cell.dataset.pieceId = p.id;
        cell.title = p.name;

        // Build merged-look outline: fill gap into same-piece neighbors;
        // draw 2px black outline on the outer edges of the piece.
        const GAP = 2;
        const OUT = 2;
        const right = isOn(r, c + 1);
        const down = isOn(r + 1, c);
        const diag = isOn(r + 1, c + 1);
        const left = isOn(r, c - 1);
        const up = isOn(r - 1, c);
        const shadows = [];
        // Gap-fill toward same-piece neighbors
        if (right) shadows.push(`${GAP}px 0 0 0 ${p.color}`);
        if (down) shadows.push(`0 ${GAP}px 0 0 ${p.color}`);
        if (right && down && diag) shadows.push(`${GAP}px ${GAP}px 0 0 ${p.color}`);
        // Black outline on outer edges only
        if (!up) shadows.push(`inset 0 ${OUT}px 0 0 #000`);
        if (!down) shadows.push(`inset 0 ${-OUT}px 0 0 #000`);
        if (!left) shadows.push(`inset ${OUT}px 0 0 0 #000`);
        if (!right) shadows.push(`inset ${-OUT}px 0 0 0 #000`);
        cell.style.boxShadow = shadows.join(', ');
      }
    }
  }
  if (held && hoverCell) drawPreview();
  const filled = countFilled();
  if (filled === target) {
    $status.textContent = `Solved! All ${target} cells filled.`;
    $status.className = 'status full';
  } else {
    $status.textContent = `${filled} / ${target} cells filled`;
    $status.className = 'status';
  }
}

function countFilled() {
  let n = 0;
  for (const p of PIECE_COLORS) if (placements[p.id]) n += cellCount(placements[p.id].shape);
  return n;
}

function onHover(r, c) {
  hoverCell = r === null ? null : { r, c };
  refreshBoard();
}

function drawPreview() {
  const { r, c } = hoverCell;
  const shape = held.shape;
  let ok = true;
  const cells = [];
  for (let dr = 0; dr < shape.length; dr++) {
    for (let dc = 0; dc < shape[0].length; dc++) {
      if (!shape[dr][dc]) continue;
      const rr = r + dr;
      const cc = c + dc;
      cells.push([rr, cc]);
      if (rr < 0 || rr >= BOARD_ROWS || cc < 0 || cc >= BOARD_COLS) ok = false;
      else {
        const idx = rr * BOARD_COLS + cc;
        if ($board.children[idx].classList.contains('filled')) ok = false;
      }
    }
  }
  for (const [rr, cc] of cells) {
    if (rr < 0 || rr >= BOARD_ROWS || cc < 0 || cc >= BOARD_COLS) continue;
    const idx = rr * BOARD_COLS + cc;
    $board.children[idx].classList.add(ok ? 'preview-ok' : 'preview-bad');
  }
}

function pickFromTray(id) {
  if (placements[id]) return;
  const piece = PIECE_COLORS.find((p) => p.id === id);
  const shape = trimShape(getShape(id));
  if (cellCount(shape) === 0) return;
  held = { piece, shape };
  refreshTray();
  refreshHeldPreview();
  refreshBoard();
}

function onClickCell(r, c) {
  const idx = r * BOARD_COLS + c;
  const cell = $board.children[idx];
  const placedId = cell.dataset.pieceId;

  if (!held && placedId) {
    const pl = placements[placedId];
    placements[placedId] = null;
    const piece = PIECE_COLORS.find((p) => p.id === placedId);
    held = { piece, shape: pl.shape };
    refreshTray();
    refreshHeldPreview();
    refreshBoard();
    return;
  }
  if (!held) return;
  if (canPlace(held.shape, r, c)) {
    placements[held.piece.id] = { row: r, col: c, shape: held.shape };
    held = null;
    refreshTray();
    refreshHeldPreview();
    refreshBoard();
  }
}

function canPlace(shape, row, col) {
  for (let dr = 0; dr < shape.length; dr++) {
    for (let dc = 0; dc < shape[0].length; dc++) {
      if (!shape[dr][dc]) continue;
      const rr = row + dr;
      const cc = col + dc;
      if (rr < 0 || rr >= BOARD_ROWS || cc < 0 || cc >= BOARD_COLS) return false;
      const idx = rr * BOARD_COLS + cc;
      if ($board.children[idx].classList.contains('filled')) return false;
    }
  }
  return true;
}

$btnRotate.addEventListener('click', () => {
  if (!held) return;
  held.shape = rotateCW(held.shape);
  refreshHeldPreview();
  refreshBoard();
});
$btnFlip.addEventListener('click', () => {
  if (!held) return;
  held.shape = flipH(held.shape);
  refreshHeldPreview();
  refreshBoard();
});
$btnCancel.addEventListener('click', dropHeld);
$btnResetBoard.addEventListener('click', () => {
  for (const k of Object.keys(placements)) placements[k] = null;
  held = null;
  refreshTray();
  refreshHeldPreview();
  refreshBoard();
});
function dropHeld() {
  held = null;
  refreshTray();
  refreshHeldPreview();
  refreshBoard();
}
document.addEventListener('keydown', (e) => {
  if (document.getElementById('view-solver').classList.contains('active') === false) return;
  if (e.key === 'r' || e.key === 'R') $btnRotate.click();
  else if (e.key === 'f' || e.key === 'F') $btnFlip.click();
  else if (e.key === 'Escape') dropHeld();
});

// =====================================================================
// Init
// =====================================================================
loadShapes();
buildEditor();
buildBoard();
rebuildSolverTray();
refreshHeldPreview();
refreshBoard();
updateMeta();

// =====================================================================
// AUTO-SOLVE view (worker-based backtracking)
// =====================================================================
const $solveBtn = document.getElementById('btn-solve');
const $stopBtn = document.getElementById('btn-stop-solve');
const $clearBtn = document.getElementById('btn-clear-solutions');
const $solveStatus = document.getElementById('solve-status');
const $solutionsGrid = document.getElementById('solutions-grid');
const $maxSolutions = document.getElementById('max-solutions');

let worker = null;

function renderSolutionCard(index, placements) {
  const card = document.createElement('div');
  card.className = 'solution-card';
  const title = document.createElement('h4');
  title.textContent = `Solution ${index}`;
  card.appendChild(title);

  // Build a colored grid for the board.
  const cells = new Array(BOARD_ROWS * BOARD_COLS).fill(null);
  for (const p of placements) {
    const { row, col, shape, color } = p;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c]) cells[(row + r) * BOARD_COLS + (col + c)] = { color, id: p.id };
      }
    }
  }
  const board = document.createElement('div');
  board.className = 'mini-board';
  board.style.gridTemplateColumns = `repeat(${BOARD_COLS}, 14px)`;
  const isOn = (r, c, id) => r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS && cells[r * BOARD_COLS + c]?.id === id;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const data = cells[r * BOARD_COLS + c];
      if (data) {
        cell.style.background = data.color;
        // outer black borders only
        const id = data.id;
        const shadows = [];
        if (!isOn(r - 1, c, id)) shadows.push('inset 0 2px 0 0 #000');
        if (!isOn(r + 1, c, id)) shadows.push('inset 0 -2px 0 0 #000');
        if (!isOn(r, c - 1, id)) shadows.push('inset 2px 0 0 0 #000');
        if (!isOn(r, c + 1, id)) shadows.push('inset -2px 0 0 0 #000');
        cell.style.boxShadow = shadows.join(', ');
      } else {
        cell.style.background = 'var(--empty)';
      }
      board.appendChild(cell);
    }
  }
  card.appendChild(board);
  return card;
}

function setStatus(text, kind) {
  $solveStatus.textContent = text;
  $solveStatus.dataset.kind = kind || '';
}

function startSolve() {
  if (worker) { worker.terminate(); worker = null; }
  $solutionsGrid.innerHTML = '';
  const maxSolutions = Math.max(1, parseInt($maxSolutions.value, 10) || 1);

  const pieces = getPieces().map((p) => ({ id: p.id, color: p.color, shape: p.shape }));
  const sum = pieces.reduce((s, p) => {
    let n = 0; for (const r of p.shape) for (const v of r) if (v) n++;
    return s + n;
  }, 0);
  const target = BOARD_ROWS * BOARD_COLS;
  if (sum > target) {
    setStatus(`Cannot solve: pieces sum to ${sum} but board only has ${target} cells. Remove or shrink pieces (over by ${sum - target}).`, 'bad');
    return;
  }
  const slack = target - sum;
  const slackNote = slack > 0 ? ` (${slack} cell${slack === 1 ? '' : 's'} will remain empty)` : '';
  setStatus(`Starting search across ${pieces.length} pieces${slackNote}...`, 'busy');
  $solveBtn.disabled = true;
  $stopBtn.disabled = false;

  worker = new Worker('js/solver.worker.js');
  worker.onmessage = (e) => {
    const m = e.data;
    if (m.type === 'progress') {
      setStatus(`Searching... explored ${m.explored.toLocaleString()} states, found ${m.found}`, 'busy');
    } else if (m.type === 'solution') {
      setStatus(`Found ${m.index} solution(s)...`, 'busy');
      $solutionsGrid.appendChild(renderSolutionCard(m.index, m.placements));
    } else if (m.type === 'done') {
      $solveBtn.disabled = false;
      $stopBtn.disabled = true;
      const reasonText = {
        limit: 'reached requested count',
        exhausted: 'no more solutions exist',
        stopped: 'stopped by user',
        invalid: m.detail || 'invalid configuration',
      }[m.reason];
      const kind = m.count > 0 ? 'good' : (m.reason === 'invalid' ? 'bad' : '');
      setStatus(`Done: ${m.count} solution(s), explored ${m.explored.toLocaleString()} states (${reasonText})`, kind);
      if (worker) { worker.terminate(); worker = null; }
    } else if (m.type === 'error') {
      setStatus('Error: ' + m.message, 'bad');
      $solveBtn.disabled = false;
      $stopBtn.disabled = true;
    }
  };
  worker.onerror = (err) => {
    setStatus('Worker error: ' + err.message, 'bad');
    $solveBtn.disabled = false;
    $stopBtn.disabled = true;
  };
  worker.postMessage({
    type: 'solve',
    board: { rows: BOARD_ROWS, cols: BOARD_COLS },
    pieces,
    maxSolutions,
  });
}

function stopSolve() {
  if (!worker) return;
  worker.postMessage({ type: 'stop' });
}

$solveBtn.addEventListener('click', startSolve);
$stopBtn.addEventListener('click', stopSolve);
$clearBtn.addEventListener('click', () => {
  $solutionsGrid.innerHTML = '';
  $solveStatus.textContent = '';
});
