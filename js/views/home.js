import { el, renderShape } from '../viewUtils.js';
import { listPuzzles } from '../puzzles.js';
import { cellCount, trimShape } from '../geometry.js';

export function render(root) {
  root.innerHTML = '';
  root.appendChild(el('div', { class: 'home-hero' },
    el('h1', {}, 'Wooden Block Puzzles'),
    el('p', { class: 'home-sub' },
      'A collection of polyomino packing puzzles. Pick a puzzle, then play it ' +
      'yourself or watch the solver enumerate solutions.'),
  ));

  const grid = el('div', { class: 'home-grid' });
  for (const p of listPuzzles()) {
    grid.appendChild(renderPuzzleCard(p));
  }
  root.appendChild(grid);
}

function renderPuzzleCard(puzzle) {
  const card = el('a', {
    class: 'puzzle-card',
    href: `#/${puzzle.id}`,
    style: puzzle.accent ? { borderColor: puzzle.accent + '66' } : {},
  });

  // Mini preview: pieces stacked tightly.
  const preview = el('div', { class: 'puzzle-preview' });
  for (const piece of puzzle.pieces.slice(0, 8)) {
    const trimmed = trimShape(piece.shape);
    if (cellCount(trimmed) === 0) continue;
    preview.appendChild(renderShape(trimmed, piece.color, 9));
  }

  const meta = el('div', { class: 'puzzle-meta' },
    el('h2', {}, puzzle.name),
    el('p', { class: 'puzzle-desc' }, puzzle.description),
    el('div', { class: 'puzzle-stats' },
      el('span', {}, `${puzzle.boardRows} × ${puzzle.boardCols} board`),
      el('span', {}, `${puzzle.pieces.length} pieces`),
      puzzle.editable ? el('span', { class: 'tag' }, 'editable') : null,
    ),
  );

  card.appendChild(preview);
  card.appendChild(meta);
  return card;
}
