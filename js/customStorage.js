// localStorage-backed piece set for the "Make Your Own" puzzle.
import { emptyShape } from './geometry.js';

const STORAGE_KEY = 'blockpuzzle.custom.v1';

// Default palette for a fresh custom puzzle — 6 starter slots.
// User can rename / recolor in the editor in a future iteration; for now
// these are the slots they'll fill in.
export const CUSTOM_DEFAULT_PALETTE = [
  { id: 'p1', name: 'Piece 1', color: '#5BC0DE' },
  { id: 'p2', name: 'Piece 2', color: '#7E57C2' },
  { id: 'p3', name: 'Piece 3', color: '#F39C2B' },
  { id: 'p4', name: 'Piece 4', color: '#A6CE39' },
  { id: 'p5', name: 'Piece 5', color: '#E94B7B' },
  { id: 'p6', name: 'Piece 6', color: '#F1C40F' },
];

// Persisted layout: { boardRows, boardCols, palette: [{id,name,color}], shapes: {id: matrix} }
let _state = null;

function freshState() {
  const shapes = {};
  for (const p of CUSTOM_DEFAULT_PALETTE) shapes[p.id] = emptyShape();
  return {
    boardRows: 10,
    boardCols: 8,
    palette: CUSTOM_DEFAULT_PALETTE.map((p) => ({ ...p })),
    shapes,
  };
}

export function loadCustom() {
  if (_state) return _state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) _state = JSON.parse(raw);
  } catch (e) { /* ignore */ }
  if (!_state || !_state.palette) _state = freshState();
  // Backfill missing shapes.
  for (const p of _state.palette) {
    if (!Array.isArray(_state.shapes[p.id])) _state.shapes[p.id] = emptyShape();
  }
  return _state;
}

export function saveCustom() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
}

export function setCustomShape(id, shape) {
  loadCustom();
  _state.shapes[id] = shape;
  saveCustom();
}

export function getCustomShape(id) {
  return loadCustom().shapes[id];
}

export function setCustomBoard(rows, cols) {
  loadCustom();
  _state.boardRows = rows;
  _state.boardCols = cols;
  saveCustom();
}

export function resetCustom() {
  _state = freshState();
  saveCustom();
}

export function exportCustomJSON() { return JSON.stringify(loadCustom(), null, 2); }

export function importCustomJSON(text) {
  const obj = JSON.parse(text);
  if (!obj || !Array.isArray(obj.palette)) throw new Error('Invalid custom puzzle JSON');
  _state = obj;
  for (const p of _state.palette) {
    if (!Array.isArray(_state.shapes[p.id])) _state.shapes[p.id] = emptyShape();
  }
  saveCustom();
}

// Returns the puzzle object in the same shape as predefined puzzles.
export function getCustomPuzzle() {
  const s = loadCustom();
  return {
    id: 'custom',
    name: 'Make Your Own',
    description: 'Define each piece by clicking cells, then play or auto-solve.',
    boardRows: s.boardRows,
    boardCols: s.boardCols,
    pieces: s.palette.map((p) => ({ ...p, shape: s.shapes[p.id] })),
    editable: true,
    allowSlack: true,
  };
}
