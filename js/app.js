// Hash-based router.
// Routes:
//   #/                         -> home (puzzle list)
//   #/<puzzleId>               -> puzzle landing (mode picker)
//   #/<puzzleId>/play          -> human solver
//   #/<puzzleId>/auto          -> auto solver
//   #/<puzzleId>/inspect       -> inspector
//   #/<puzzleId>/edit          -> editor (custom only)

import { getPuzzle } from './puzzles.js';
import { el } from './viewUtils.js';

import * as homeView from './views/home.js';
import * as puzzleHomeView from './views/puzzleHome.js';
import * as inspectorView from './views/inspector.js';
import * as solverView from './views/solver.js';
import * as autosolveView from './views/autosolve.js';
import * as editorView from './views/editor.js';

const app = document.getElementById('app');
const crumbs = document.getElementById('crumbs');

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);
  return parts; // [], [puzzleId], [puzzleId, mode]
}

function cleanup() {
  if (typeof app._cleanup === 'function') {
    try { app._cleanup(); } catch {}
    app._cleanup = null;
  }
}

function renderCrumbs(parts, puzzle, modeLabel) {
  crumbs.innerHTML = '';
  if (parts.length === 0) return;
  const sep = () => el('span', { class: 'sep' }, '›');
  crumbs.appendChild(el('a', { href: '#/' }, 'Home'));
  if (puzzle) {
    crumbs.appendChild(sep());
    crumbs.appendChild(el('a', { href: `#/${puzzle.id}` }, puzzle.name));
  }
  if (modeLabel) {
    crumbs.appendChild(sep());
    crumbs.appendChild(el('span', { class: 'current' }, modeLabel));
  }
}

function notFound(message) {
  app.innerHTML = '';
  app.appendChild(el('div', { class: 'view-pad' },
    el('h2', {}, 'Not found'),
    el('p', { class: 'home-sub' }, message),
    el('p', {}, el('a', { href: '#/' }, '← Back to home')),
  ));
}

function route() {
  cleanup();
  const parts = parseRoute();
  window.scrollTo({ top: 0 });

  if (parts.length === 0) {
    renderCrumbs(parts);
    homeView.render(app);
    document.title = 'Wooden Block Puzzles';
    return;
  }
  const puzzle = getPuzzle(parts[0]);
  if (!puzzle) { renderCrumbs(parts); notFound(`Unknown puzzle "${parts[0]}".`); return; }

  if (parts.length === 1) {
    renderCrumbs(parts, puzzle);
    puzzleHomeView.render(app, puzzle);
    document.title = `${puzzle.name} — Block Puzzles`;
    return;
  }

  const mode = parts[1];
  const modeMap = {
    play:    { label: 'Play',       view: solverView },
    auto:    { label: 'Auto-Solve', view: autosolveView },
    inspect: { label: 'Inspect',    view: inspectorView },
    edit:    { label: 'Edit',       view: editorView },
  };
  const entry = modeMap[mode];
  if (!entry) { renderCrumbs(parts, puzzle); notFound(`Unknown mode "${mode}".`); return; }
  if (mode === 'edit' && !puzzle.editable) {
    renderCrumbs(parts, puzzle); notFound('This puzzle is not editable.'); return;
  }

  renderCrumbs(parts, puzzle, entry.label);
  // Wrap in padding container.
  app.innerHTML = '';
  const pad = el('div', { class: 'view-pad' });
  app.appendChild(pad);
  entry.view.render(pad, puzzle);
  // Bubble cleanup up to app element.
  if (typeof pad._cleanup === 'function') app._cleanup = pad._cleanup;
  document.title = `${entry.label} · ${puzzle.name} — Block Puzzles`;
}

window.addEventListener('hashchange', route);
route();
