// Editor for the "Make Your Own" puzzle. Lets the user toggle cells per
// piece and change the board size. Auto-saves to localStorage.
import { el, renderShape } from '../viewUtils.js';
import { cellCount, emptyShape } from '../geometry.js';
import {
  loadCustom, setCustomShape, getCustomShape, setCustomBoard,
  resetCustom, exportCustomJSON, importCustomJSON,
} from '../customStorage.js';

export function render(root) {
  loadCustom();
  root.innerHTML = '';

  const state = loadCustom();

  // ----- toolbar -----
  const status = el('span', { class: 'muted-status' });
  const saveStatus = el('p', { class: 'hint small', style: { marginTop: '.25rem' } });

  function flash(msg) {
    saveStatus.textContent = msg;
    setTimeout(() => { if (saveStatus.textContent === msg) saveStatus.textContent = ''; }, 3000);
  }

  const rowsInput = el('input', { type: 'number', min: '1', max: '40', value: String(state.boardRows) });
  const colsInput = el('input', { type: 'number', min: '1', max: '40', value: String(state.boardCols) });
  rowsInput.addEventListener('change', () => {
    const v = Math.max(1, parseInt(rowsInput.value, 10) || 1);
    setCustomBoard(v, state.boardCols);
    state.boardRows = v;
    updateMeta();
  });
  colsInput.addEventListener('change', () => {
    const v = Math.max(1, parseInt(colsInput.value, 10) || 1);
    setCustomBoard(state.boardRows, v);
    state.boardCols = v;
    updateMeta();
  });

  const ioText = el('textarea', { rows: 3, placeholder: 'Paste JSON, then click Paste JSON. Or click Copy JSON to dump.' });
  const fileInput = el('input', { type: 'file', accept: 'application/json,.json' });
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', loadFromFile);

  const toolbar = el('div', { class: 'editor-toolbar' },
    el('label', {}, 'Board rows: ', rowsInput),
    el('label', {}, 'cols: ', colsInput),
    el('button', { onclick: saveToFile }, '💾 Save file'),
    el('button', { onclick: () => fileInput.click() }, '📂 Load file'),
    el('button', { onclick: copyJSON }, 'Copy JSON'),
    el('button', { onclick: pasteJSON }, 'Paste JSON'),
    el('button', { class: 'danger', onclick: doReset }, 'Reset all'),
    ioText,
  );
  root.appendChild(toolbar);
  root.appendChild(fileInput);

  const meta = el('p', { class: 'home-sub' });
  root.appendChild(meta);
  root.appendChild(saveStatus);

  // ----- gallery -----
  const gallery = el('div', { class: 'gallery' });
  root.appendChild(gallery);
  for (const p of state.palette) gallery.appendChild(renderEditorCard(p));

  updateMeta();

  function updateMeta() {
    const target = state.boardRows * state.boardCols;
    let sum = 0;
    for (const p of state.palette) sum += cellCount(getCustomShape(p.id));
    meta.innerHTML =
      `Board ${state.boardRows} × ${state.boardCols} = ${target} cells. ` +
      `Pieces sum: <strong style="color:${
        sum === target ? '#2ecc71' : sum > target ? '#e74c3c' : '#e0a23e'
      }">${sum}</strong> ` +
      (sum === target ? '✓ exact pack' :
       sum > target ? `(over by ${sum - target})` :
                      `(${target - sum} cells will remain empty)`);
  }

  function renderEditorCard(piece) {
    const card = el('div', { class: 'piece-card' });
    card.dataset.pieceId = piece.id;
    const renderGrid = () => {
      const shape = getCustomShape(piece.id);
      const h = shape.length, w = shape[0].length;
      const cellPx = 24;
      const grid = el('div', {
        class: 'piece-grid editor-grid',
        style: { gridTemplateColumns: `repeat(${w}, ${cellPx}px)`, gridAutoRows: `${cellPx}px` },
      });
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          const cell = el('div', { class: 'cell' + (shape[r][c] ? ' on' : '') });
          if (shape[r][c]) cell.style.background = piece.color;
          cell.addEventListener('click', () => {
            const s = getCustomShape(piece.id);
            const val = s[r][c] ? 0 : 1;
            s[r][c] = val;
            setCustomShape(piece.id, s);
            cell.classList.toggle('on', !!val);
            cell.style.background = val ? piece.color : '';
            countLabel.textContent = `${cellCount(s)} cells`;
            updateMeta();
          });
          grid.appendChild(cell);
        }
      }
      return grid;
    };

    const countLabel = el('span', { class: 'count' }, `${cellCount(getCustomShape(piece.id))} cells`);
    card.appendChild(el('h3', {},
      el('span', { class: 'swatch', style: { background: piece.color } }),
      piece.name,
      countLabel,
    ));
    let gridEl = renderGrid();
    card.appendChild(gridEl);

    const sizeControls = el('div', { class: 'size-controls' });
    const mkBtn = (label, act) => el('button', { onclick: () => {
      let s = getCustomShape(piece.id).map((r) => r.slice());
      const h = s.length, w = s[0].length;
      if (act === 'row+') s.push(Array(w).fill(0));
      else if (act === 'row-' && h > 1) s.pop();
      else if (act === 'col+') s = s.map((r) => [...r, 0]);
      else if (act === 'col-' && w > 1) s = s.map((r) => r.slice(0, -1));
      else if (act === 'clear') s = emptyShape(h, w);
      setCustomShape(piece.id, s);
      const newGrid = renderGrid();
      card.replaceChild(newGrid, gridEl);
      gridEl = newGrid;
      countLabel.textContent = `${cellCount(s)} cells`;
      updateMeta();
    } }, label);
    sizeControls.append(
      mkBtn('−row', 'row-'), mkBtn('+row', 'row+'),
      mkBtn('−col', 'col-'), mkBtn('+col', 'col+'),
      mkBtn('clear', 'clear'),
    );
    card.appendChild(sizeControls);
    return card;
  }

  // ----- IO -----
  function saveToFile() {
    const json = exportCustomJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url; a.download = `custom-puzzle-${stamp}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    flash(`Saved ${a.download}`);
  }
  async function loadFromFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      importCustomJSON(await file.text());
      render(root);
      flash(`Loaded ${file.name}`);
    } catch (err) { alert('Failed: ' + err.message); }
    finally { fileInput.value = ''; }
  }
  function copyJSON() { ioText.value = exportCustomJSON(); flash('JSON copied to textarea'); }
  function pasteJSON() {
    const text = ioText.value.trim(); if (!text) return;
    try { importCustomJSON(text); render(root); flash('Imported.'); }
    catch (err) { alert('Invalid JSON: ' + err.message); }
  }
  function doReset() {
    if (!confirm('Erase all pieces and reset board?')) return;
    resetCustom();
    render(root);
  }
}
