// Piece registry. Shapes are defined by the user in the Piece Editor and
// persisted in localStorage. This module owns:
//   * the canonical list of colors / names
//   * geometry helpers (rotate, flip, trim)
//   * load/save of the shapes dictionary

export const BOARD_COLS = 10;
export const BOARD_ROWS = 15;

// id, name, color — also the display order in the UI.
export const PIECE_COLORS = [
  { id: 'light_blue', name: 'Light Blue', color: '#5BC0DE' },
  { id: 'purple',     name: 'Purple',     color: '#7E57C2' },
  { id: 'white',      name: 'White',      color: '#FFFFFF' },
  { id: 'orange',     name: 'Orange',     color: '#F39C2B' },
  { id: 'lime',       name: 'Lime Green', color: '#A6CE39' },
  { id: 'dark_green', name: 'Dark Green', color: '#2E7D32' },
  { id: 'pink',       name: 'Pink',       color: '#E94B7B' },
  { id: 'dark_blue',  name: 'Dark Blue',  color: '#1F3A93' },
  { id: 'yellow',     name: 'Yellow',     color: '#F1C40F' },
  { id: 'red',        name: 'Red',        color: '#D7263D' },
  { id: 'black',      name: 'Black',      color: '#2B2B2B' },
  { id: 'brown',      name: 'Brown',      color: '#5D3A1A' },
];

const STORAGE_KEY = 'pentomino.shapes.v1';

// Default piece shapes, baked in so the site works on first load
// (GitHub Pages, no localStorage required). Users can override via the
// Piece Editor; their edits are saved to localStorage and take precedence.
export const DEFAULT_SHAPES = {
  light_blue: [[1,0,0,0],[1,1,1,1],[1,1,1,1],[0,1,1,1]],
  purple:     [[0,1,1,0],[1,1,1,0],[1,1,1,1],[0,1,1,1]],
  white:      [[1,1,1],[1,1,1],[1,1,1],[1,1,1]],
  orange:     [[0,1,1,0],[1,1,1,1],[1,1,1,1],[0,1,1,0]],
  lime:       [[1,1,1,0],[1,1,1,1],[0,1,1,1],[0,0,1,1]],
  dark_green: [[1,1,0],[1,1,0],[1,1,1],[1,1,1],[0,1,1]],
  pink:       [[1,1,0,0],[1,1,1,0],[1,1,1,0],[1,1,0,0],[1,1,0,0]],
  dark_blue:  [[1,1,1,1],[1,1,1,1],[0,1,1,0],[0,1,1,0]],
  yellow:     [[1,1,1],[1,1,1],[1,1,0],[1,1,0],[1,1,0]],
  red:        [[1,1,0,0],[1,1,1,1],[1,1,1,1],[0,0,1,1]],
  black:      [[1,1,1,1,1,1],[1,1,1,1,1,1]],
  brown:      [[1,1,1,1],[1,1,1,1],[0,0,1,1],[0,0,1,1]],
};

export function emptyShape(rows = 4, cols = 4) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

let _shapes = null;

export function loadShapes() {
  if (_shapes) return _shapes;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) _shapes = JSON.parse(raw);
  } catch (e) { /* ignore */ }
  if (!_shapes) _shapes = {};
  for (const p of PIECE_COLORS) {
    if (!Array.isArray(_shapes[p.id])) {
      _shapes[p.id] = DEFAULT_SHAPES[p.id]
        ? DEFAULT_SHAPES[p.id].map((r) => r.slice())
        : emptyShape();
    }
  }
  return _shapes;
}

export function saveShapes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_shapes));
}

export function setShape(pieceId, shape) {
  loadShapes();
  _shapes[pieceId] = shape;
  saveShapes();
}

export function getShape(pieceId) {
  return loadShapes()[pieceId];
}

export function resetAll() {
  _shapes = {};
  for (const p of PIECE_COLORS) {
    _shapes[p.id] = DEFAULT_SHAPES[p.id]
      ? DEFAULT_SHAPES[p.id].map((r) => r.slice())
      : emptyShape();
  }
  saveShapes();
}

export function exportJSON() {
  return JSON.stringify(loadShapes(), null, 2);
}

export function importJSON(text) {
  const obj = JSON.parse(text);
  _shapes = {};
  for (const p of PIECE_COLORS) {
    _shapes[p.id] = Array.isArray(obj[p.id]) ? obj[p.id] : emptyShape();
  }
  saveShapes();
}

// ----- Geometry helpers ------------------------------------------------

export function cloneShape(shape) {
  return shape.map((row) => row.slice());
}

export function cellCount(shape) {
  let n = 0;
  for (const row of shape) for (const v of row) if (v) n++;
  return n;
}

// Trim empty borders. Returns 1x1 zero grid if everything is empty.
export function trimShape(shape) {
  let top = 0, bot = shape.length - 1, left = 0, right = shape[0].length - 1;
  const rowEmpty = (r) => shape[r].every((v) => !v);
  const colEmpty = (c) => shape.every((row) => !row[c]);
  while (top <= bot && rowEmpty(top)) top++;
  while (bot >= top && rowEmpty(bot)) bot--;
  if (top > bot) return [[0]];
  while (left <= right && colEmpty(left)) left++;
  while (right >= left && colEmpty(right)) right--;
  const out = [];
  for (let r = top; r <= bot; r++) out.push(shape[r].slice(left, right + 1));
  return out;
}

export function rotateCW(shape) {
  const h = shape.length;
  const w = shape[0].length;
  const out = Array.from({ length: w }, () => Array(h).fill(0));
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      out[c][h - 1 - r] = shape[r][c];
    }
  }
  return out;
}

export function flipH(shape) {
  return shape.map((row) => row.slice().reverse());
}

export function totalCells() {
  const s = loadShapes();
  return PIECE_COLORS.reduce((sum, p) => sum + cellCount(s[p.id]), 0);
}

// Convenience: list of { id, name, color, shape } using current saved shapes,
// trimmed so the bounding box hugs the filled cells.
export function getPieces() {
  const s = loadShapes();
  return PIECE_COLORS.map((p) => ({ ...p, shape: trimShape(s[p.id]) }));
}
