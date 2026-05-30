import { el } from '../viewUtils.js';

export function render(root, puzzle) {
  root.innerHTML = '';

  const modes = [
    { id: 'play', title: 'Play', desc: 'Pick pieces and place them on the board by hand.' },
    { id: 'auto', title: 'Auto-Solve', desc: 'Let the solver enumerate valid packings.' },
    { id: 'inspect', title: 'Inspect', desc: 'View the piece shapes and cell counts.' },
  ];
  if (puzzle.editable) modes.unshift({
    id: 'edit', title: 'Edit Pieces', desc: 'Click cells to define each piece shape.',
  });

  root.appendChild(el('div', { class: 'puzzle-landing' },
    el('h1', {}, puzzle.name),
    el('p', { class: 'home-sub' }, puzzle.description),
    el('div', { class: 'mode-grid' },
      ...modes.map((m) =>
        el('a', { class: 'mode-card', href: `#/${puzzle.id}/${m.id}` },
          el('h3', {}, m.title),
          el('p', {}, m.desc),
        ),
      ),
    ),
  ));
}
