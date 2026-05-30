import { el, renderShape } from '../viewUtils.js';
import { cellCount, trimShape } from '../geometry.js';

export function render(root, puzzle) {
  const target = puzzle.boardRows * puzzle.boardCols;
  let sum = 0;
  for (const p of puzzle.pieces) sum += cellCount(trimShape(p.shape));

  root.innerHTML = '';
  root.appendChild(el('div', { class: 'inspector-header' },
    el('p', { class: 'home-sub' },
      `Board ${puzzle.boardRows} × ${puzzle.boardCols} = ${target} cells. ` +
      `Pieces sum to ${sum} (` +
        (sum === target ? 'exact pack' :
         sum < target ? `${target - sum} empty cell${target - sum === 1 ? '' : 's'} allowed`
                      : `${sum - target} cells over the board — cannot pack`) +
      ').'),
  ));

  const gallery = el('div', { class: 'gallery' });
  for (const p of puzzle.pieces) {
    const shape = trimShape(p.shape);
    const empty = cellCount(shape) === 0;
    const card = el('div', { class: 'piece-card' },
      el('h3', {},
        el('span', { class: 'swatch', style: { background: p.color } }),
        p.name,
        el('span', { class: 'count' }, `${cellCount(shape)} cells`),
      ),
      renderShape(empty ? [[0]] : shape, p.color, 20),
      el('div', { class: 'meta-row' },
        empty ? el('span', { style: { color: '#e74c3c' } }, 'empty')
              : el('span', {}, `${shape.length} × ${shape[0].length}`),
      ),
    );
    gallery.appendChild(card);
  }
  root.appendChild(gallery);
}
