// Shared rendering helpers for views.
import { cellCount } from './geometry.js';

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') node.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, '');
    else if (v != null && v !== false) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

// Renders a static piece-shape grid (used in inspector, tray, solution cards).
export function renderShape(shape, color, cellPx = 18) {
  const h = shape.length, w = shape[0].length;
  const grid = el('div', {
    class: 'piece-grid',
    style: {
      gridTemplateColumns: `repeat(${w}, ${cellPx}px)`,
      gridAutoRows: `${cellPx}px`,
    },
  });
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const cell = el('div', { class: 'cell' + (shape[r][c] ? ' on' : '') });
      if (shape[r][c]) cell.style.background = color;
      grid.appendChild(cell);
    }
  }
  return grid;
}

// Renders a board cell at (r,c) with merged-piece outline against neighbors of same piece id.
// Returns box-shadow string only — caller sets background.
export function mergedOutlineShadow(getCellId, r, c, id, OUT = 2) {
  const same = (rr, cc) => getCellId(rr, cc) === id;
  const shadows = [];
  if (!same(r - 1, c)) shadows.push(`inset 0 ${OUT}px 0 0 #000`);
  if (!same(r + 1, c)) shadows.push(`inset 0 ${-OUT}px 0 0 #000`);
  if (!same(r, c - 1)) shadows.push(`inset ${OUT}px 0 0 0 #000`);
  if (!same(r, c + 1)) shadows.push(`inset ${-OUT}px 0 0 0 #000`);
  return shadows.join(', ');
}

export function sumCells(pieces) {
  let n = 0;
  for (const p of pieces) n += cellCount(p.shape);
  return n;
}

export function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
