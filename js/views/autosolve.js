import { el, mergedOutlineShadow } from '../viewUtils.js';
import { cellCount, trimShape } from '../geometry.js';

export function render(root, puzzle) {
  const ROWS = puzzle.boardRows;
  const COLS = puzzle.boardCols;
  const TARGET = ROWS * COLS;

  root.innerHTML = '';
  const status = el('span', { class: 'muted-status' });
  const maxInput = el('input', { type: 'number', min: '1', max: '1000', value: '10', id: 'max-solutions' });
  const btnSolve = el('button', {}, 'Find solutions');
  const btnStop = el('button', {}, 'Stop'); btnStop.disabled = true;
  const btnClear = el('button', {}, 'Clear');
  const grid = el('div', { class: 'solutions-grid' });

  root.appendChild(el('div', { class: 'solve-toolbar' },
    el('label', {}, 'Max solutions: ', maxInput),
    btnSolve, btnStop, btnClear, status,
  ));
  root.appendChild(grid);

  let worker = null;

  function setStatus(text, kind) {
    status.textContent = text;
    status.dataset.kind = kind || '';
  }

  function renderSolutionCard(index, placements) {
    const card = el('div', { class: 'solution-card' });
    card.appendChild(el('h4', {}, `Solution ${index}`));
    const idAt = new Array(ROWS * COLS).fill(null);
    const colorOf = new Map();
    for (const p of placements) {
      colorOf.set(p.id, p.color);
      for (let r = 0; r < p.shape.length; r++)
        for (let c = 0; c < p.shape[0].length; c++)
          if (p.shape[r][c]) idAt[(p.row + r) * COLS + (p.col + c)] = p.id;
    }
    const getId = (r, c) => (r < 0 || r >= ROWS || c < 0 || c >= COLS) ? null : idAt[r * COLS + c];
    const board = el('div', {
      class: 'mini-board',
      style: { gridTemplateColumns: `repeat(${COLS}, 14px)` },
    });
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const id = idAt[r * COLS + c];
        const cell = el('div', { class: 'cell' });
        if (id != null) {
          cell.style.background = colorOf.get(id);
          cell.style.boxShadow = mergedOutlineShadow(getId, r, c, id);
        } else {
          cell.style.background = 'var(--empty)';
        }
        board.appendChild(cell);
      }
    }
    card.appendChild(board);
    return card;
  }

  function start() {
    if (worker) { worker.terminate(); worker = null; }
    grid.innerHTML = '';

    const pieces = puzzle.pieces.map((p) => ({
      id: p.id, color: p.color, shape: trimShape(p.shape),
    })).filter((p) => cellCount(p.shape) > 0);

    if (pieces.length === 0) {
      setStatus('No piece shapes defined yet. Define them in the editor first.', 'bad');
      return;
    }
    const sum = pieces.reduce((s, p) => s + cellCount(p.shape), 0);
    if (sum > TARGET) {
      setStatus(`Cannot solve: pieces sum to ${sum} but board only has ${TARGET} cells (over by ${sum - TARGET}).`, 'bad');
      return;
    }
    if (!puzzle.allowSlack && sum < TARGET) {
      setStatus(`This puzzle requires an exact pack: pieces sum to ${sum}, board needs ${TARGET}.`, 'bad');
      return;
    }
    const slack = TARGET - sum;
    const slackNote = slack > 0 ? ` (${slack} empty cell${slack === 1 ? '' : 's'} allowed)` : '';
    setStatus(`Starting search across ${pieces.length} pieces${slackNote}...`, 'busy');
    btnSolve.disabled = true; btnStop.disabled = false;

    const maxSolutions = Math.max(1, parseInt(maxInput.value, 10) || 1);
    worker = new Worker('js/solver.worker.js');
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'progress') {
        setStatus(`Searching... explored ${m.explored.toLocaleString()} states, found ${m.found}`, 'busy');
      } else if (m.type === 'solution') {
        setStatus(`Found ${m.index} solution(s)...`, 'busy');
        grid.appendChild(renderSolutionCard(m.index, m.placements));
      } else if (m.type === 'done') {
        btnSolve.disabled = false; btnStop.disabled = true;
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
        btnSolve.disabled = false; btnStop.disabled = true;
      }
    };
    worker.onerror = (err) => {
      setStatus('Worker error: ' + err.message, 'bad');
      btnSolve.disabled = false; btnStop.disabled = true;
    };
    worker.postMessage({
      type: 'solve',
      board: { rows: ROWS, cols: COLS },
      pieces,
      maxSolutions,
    });
  }

  btnSolve.addEventListener('click', start);
  btnStop.addEventListener('click', () => { if (worker) worker.postMessage({ type: 'stop' }); });
  btnClear.addEventListener('click', () => { grid.innerHTML = ''; setStatus('', ''); });

  root._cleanup = () => { if (worker) { worker.terminate(); worker = null; } };
}
