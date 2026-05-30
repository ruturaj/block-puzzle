// Pure geometry helpers used by every puzzle.

export function cloneShape(s) { return s.map((r) => r.slice()); }

export function cellCount(s) {
  let n = 0; for (const r of s) for (const v of r) if (v) n++; return n;
}

export function rotateCW(s) {
  const h = s.length, w = s[0].length;
  const out = Array.from({ length: w }, () => Array(h).fill(0));
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++)
      out[c][h - 1 - r] = s[r][c];
  return out;
}

export function flipH(s) { return s.map((r) => r.slice().reverse()); }

export function trimShape(s) {
  let top = 0, bot = s.length - 1, l = 0, r = s[0].length - 1;
  const re = (i) => s[i].every((v) => !v);
  const ce = (j) => s.every((row) => !row[j]);
  while (top <= bot && re(top)) top++;
  while (bot >= top && re(bot)) bot--;
  if (top > bot) return [[0]];
  while (l <= r && ce(l)) l++;
  while (r >= l && ce(r)) r--;
  const out = [];
  for (let i = top; i <= bot; i++) out.push(s[i].slice(l, r + 1));
  return out;
}

function key(s) { return s.map((r) => r.join('')).join('/'); }

export function allOrientations(shape) {
  const seen = new Set();
  const out = [];
  let s = cloneShape(shape);
  for (let f = 0; f < 2; f++) {
    let cur = s;
    for (let i = 0; i < 4; i++) {
      const k = key(cur);
      if (!seen.has(k)) { seen.add(k); out.push(cur); }
      cur = rotateCW(cur);
    }
    s = flipH(s);
  }
  return out;
}

export function emptyShape(rows = 4, cols = 4) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}
