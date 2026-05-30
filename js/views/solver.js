import { el, renderShape, mergedOutlineShadow } from '../viewUtils.js';
import { cellCount, trimShape, rotateCW, flipH, cloneShape } from '../geometry.js';

export function render(root, puzzle) {
  const ROWS = puzzle.boardRows;
  const COLS = puzzle.boardCols;
  const TARGET = ROWS * COLS;

  // ---- state ----
  const placements = Object.fromEntries(puzzle.pieces.map((p) => [p.id, null]));
  let held = null;        // { piece, shape }
  let hoverCell = null;

  root.innerHTML = '';
  const layout = el('div', { class: 'solver-layout' });
  root.appendChild(layout);

  const tray = el('aside', { class: 'tray' });
  const boardWrap = el('main', { class: 'board-wrap' });
  layout.appendChild(tray);
  layout.appendChild(boardWrap);

  // ---- tray ----
  tray.appendChild(el('h2', {}, 'Pieces'));
  tray.appendChild(el('p', { class: 'hint small' },
    'Tap a piece to pick it up. ',
    el('kbd', {}, 'R'), ' rotate · ',
    el('kbd', {}, 'F'), ' flip · ',
    el('kbd', {}, 'Esc'), ' drop. Tap the board to place; tap a placed piece to lift it.',
  ));

  const btnRotate = el('button', { onclick: () => { if (!held) return; held.shape = rotateCW(held.shape); refreshHeld(); refreshBoard(); } }, 'Rotate (R)');
  const btnFlip   = el('button', { onclick: () => { if (!held) return; held.shape = flipH(held.shape);   refreshHeld(); refreshBoard(); } }, 'Flip (F)');
  const btnDrop   = el('button', { onclick: dropHeld }, 'Drop (Esc)');
  const btnReset  = el('button', { onclick: () => {
    for (const k of Object.keys(placements)) placements[k] = null;
    held = null; refreshTray(); refreshHeld(); refreshBoard();
  } }, 'Reset Board');
  btnRotate.disabled = btnFlip.disabled = btnDrop.disabled = true;
  tray.appendChild(el('div', { class: 'controls' }, btnRotate, btnFlip, btnDrop, btnReset));

  const heldPreview = el('div', { class: 'held-preview empty' });
  tray.appendChild(heldPreview);

  const trayPieces = el('div', { class: 'tray-pieces' });
  for (const p of puzzle.pieces) {
    const trimmed = trimShape(p.shape);
    const empty = cellCount(trimmed) === 0;
    const tile = el('div', { class: 'tray-piece' + (empty ? ' empty' : '') });
    tile.dataset.id = p.id;
    tile.appendChild(renderShape(empty ? [[0]] : trimmed, p.color, 14));
    tile.appendChild(el('div', { class: 'label' }, p.name + (empty ? ' (empty)' : '')));
    if (!empty) tile.addEventListener('click', () => pickFromTray(p.id));
    trayPieces.appendChild(tile);
  }
  tray.appendChild(trayPieces);

  // ---- board ----
  boardWrap.appendChild(el('h2', {}, `Box (${COLS} × ${ROWS})`));
  const boardEl = el('div', {
    class: 'board',
    style: {
      gridTemplateColumns: `repeat(${COLS}, var(--cell))`,
      gridAutoRows: 'var(--cell)',
    },
  });
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = el('div', { class: 'cell' });
      cell.dataset.r = r; cell.dataset.c = c;
      cell.addEventListener('mouseenter', () => { hoverCell = { r, c }; refreshBoard(); });
      cell.addEventListener('mouseleave', () => { hoverCell = null; refreshBoard(); });
      cell.addEventListener('click', () => onClickCell(r, c));
      boardEl.appendChild(cell);
    }
  }
  boardWrap.appendChild(boardEl);
  const status = el('div', { class: 'status' });
  boardWrap.appendChild(status);

  // ---- helpers ----
  function refreshTray() {
    for (const tile of trayPieces.children) {
      const id = tile.dataset.id;
      tile.classList.toggle('placed', !!placements[id]);
      tile.classList.toggle('held', held && held.piece.id === id);
    }
  }
  function refreshHeld() {
    heldPreview.innerHTML = '';
    if (!held) {
      heldPreview.classList.add('empty');
      btnRotate.disabled = btnFlip.disabled = btnDrop.disabled = true;
      return;
    }
    heldPreview.classList.remove('empty');
    heldPreview.appendChild(renderShape(held.shape, held.piece.color, 18));
    btnRotate.disabled = btnFlip.disabled = btnDrop.disabled = false;
  }
  function countFilled() {
    let n = 0;
    for (const p of puzzle.pieces) if (placements[p.id]) n += cellCount(placements[p.id].shape);
    return n;
  }
  function refreshBoard() {
    for (const cell of boardEl.children) {
      cell.className = 'cell'; cell.style.background = ''; cell.style.boxShadow = '';
      cell.title = ''; delete cell.dataset.pieceId;
    }
    const idAt = new Array(ROWS * COLS).fill(null);
    for (const p of puzzle.pieces) {
      const pl = placements[p.id]; if (!pl) continue;
      const { row, col, shape } = pl;
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[0].length; c++)
          if (shape[r][c]) idAt[(row + r) * COLS + (col + c)] = p.id;
    }
    const getId = (r, c) => (r < 0 || r >= ROWS || c < 0 || c >= COLS) ? null : idAt[r * COLS + c];
    for (const p of puzzle.pieces) {
      const pl = placements[p.id]; if (!pl) continue;
      const { row, col, shape } = pl;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
          if (!shape[r][c]) continue;
          const idx = (row + r) * COLS + (col + c);
          const cell = boardEl.children[idx];
          cell.classList.add('filled');
          cell.style.background = p.color;
          cell.dataset.pieceId = p.id;
          cell.title = p.name;
          cell.style.boxShadow = mergedOutlineShadow(getId, row + r, col + c, p.id);
        }
      }
    }
    if (held && hoverCell) drawPreview();
    const filled = countFilled();
    if (filled === TARGET) {
      status.textContent = `Solved! All ${TARGET} cells filled.`;
      status.className = 'status full';
    } else {
      status.textContent = `${filled} / ${TARGET} cells filled`;
      status.className = 'status';
    }
  }
  function drawPreview() {
    const { r, c } = hoverCell;
    const shape = held.shape;
    let ok = true;
    const cells = [];
    for (let dr = 0; dr < shape.length; dr++) {
      for (let dc = 0; dc < shape[0].length; dc++) {
        if (!shape[dr][dc]) continue;
        const rr = r + dr, cc = c + dc;
        cells.push([rr, cc]);
        if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) ok = false;
        else if (boardEl.children[rr * COLS + cc].classList.contains('filled')) ok = false;
      }
    }
    for (const [rr, cc] of cells) {
      if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) continue;
      boardEl.children[rr * COLS + cc].classList.add(ok ? 'preview-ok' : 'preview-bad');
    }
  }
  function canPlace(shape, row, col) {
    for (let dr = 0; dr < shape.length; dr++)
      for (let dc = 0; dc < shape[0].length; dc++) {
        if (!shape[dr][dc]) continue;
        const rr = row + dr, cc = col + dc;
        if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) return false;
        if (boardEl.children[rr * COLS + cc].classList.contains('filled')) return false;
      }
    return true;
  }
  function pickFromTray(id) {
    if (placements[id]) return;
    const piece = puzzle.pieces.find((p) => p.id === id);
    const shape = trimShape(piece.shape);
    if (cellCount(shape) === 0) return;
    held = { piece, shape };
    refreshTray(); refreshHeld(); refreshBoard();
  }
  function onClickCell(r, c) {
    const cell = boardEl.children[r * COLS + c];
    const placedId = cell.dataset.pieceId;
    if (!held && placedId) {
      const pl = placements[placedId]; placements[placedId] = null;
      const piece = puzzle.pieces.find((p) => p.id === placedId);
      held = { piece, shape: pl.shape };
      refreshTray(); refreshHeld(); refreshBoard();
      return;
    }
    if (!held) return;
    if (canPlace(held.shape, r, c)) {
      placements[held.piece.id] = { row: r, col: c, shape: cloneShape(held.shape) };
      held = null;
      refreshTray(); refreshHeld(); refreshBoard();
    }
  }
  function dropHeld() { held = null; refreshTray(); refreshHeld(); refreshBoard(); }

  function keyHandler(e) {
    if (!root.isConnected) return;
    if (e.key === 'r' || e.key === 'R') btnRotate.click();
    else if (e.key === 'f' || e.key === 'F') btnFlip.click();
    else if (e.key === 'Escape') dropHeld();
  }
  document.addEventListener('keydown', keyHandler);
  // Store cleanup on root for router to call.
  root._cleanup = () => document.removeEventListener('keydown', keyHandler);

  refreshTray(); refreshHeld(); refreshBoard();
}
