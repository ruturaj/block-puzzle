// Puzzle registry. Predefined puzzles are immutable. The custom puzzle is
// resolved dynamically from localStorage at access time.
import { WOODEN12_PIECES } from './wooden12.js';
import { PENTOMINOES } from './pentominoes.js';
import { getCustomPuzzle } from './customStorage.js';

const PREDEFINED = [
  {
    id: 'wooden12',
    name: '12-Piece Wooden Block',
    description:
      'A photographed wooden puzzle with 12 chunky polyominoes. ' +
      'Pack them into a 10 × 15 box; some empty cells may remain.',
    boardRows: 15,
    boardCols: 10,
    pieces: WOODEN12_PIECES,
    editable: false,
    allowSlack: true,
    accent: '#F39C2B',
  },
  {
    id: 'pentominoes',
    name: 'Pentominoes',
    description:
      'The 12 classic pentominoes — every distinct 5-cell shape. ' +
      'Pack the 6 × 10 board (60 cells) with no gaps.',
    boardRows: 6,
    boardCols: 10,
    pieces: PENTOMINOES,
    editable: false,
    allowSlack: false,
    accent: '#3498DB',
  },
  // Placeholder slot for the third puzzle the user will define later.
  // Hidden until populated. To enable, add another entry above with
  // editable: false and a static pieces array.
];

export function listPuzzles() {
  return [...PREDEFINED, getCustomPuzzle()];
}

export function getPuzzle(id) {
  if (id === 'custom') return getCustomPuzzle();
  return PREDEFINED.find((p) => p.id === id) || null;
}
