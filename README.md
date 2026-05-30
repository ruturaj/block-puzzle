# Wooden Block Puzzle

Single-page web app to model and solve a 12-piece wooden block puzzle on a
10 × 15 board.

**Live site:** https://ruturaj.github.io/block-puzzle/

## Features

- **Piece Editor** — click cells to define each colored piece's shape.
  Auto-saves to `localStorage`; download/upload JSON for portability.
- **Inspector** — read-only gallery of every saved shape.
- **Box Solver** — interactive 10×15 board. Pick a piece, rotate (R),
  flip (F), click to place. Lift placed pieces by clicking them.
- **Auto-Solve** — Web Worker backtracking solver enumerates valid
  packings (supports empty-cell slack when pieces underfill the board).

Default piece shapes are baked into the code so the site works on first
visit without any configuration.

## Local development

Pure static site — no build step. Use any static server:

```powershell
python -m http.server 8000
# or
npx --yes http-server -p 8000 -c-1
```

Then open <http://localhost:8000/>.

## Deployment (GitHub Pages)

Pushed to `main` and served from the repo root:

1. Repository → Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`

The included `.nojekyll` file disables Jekyll so all files (including
the `js/` folder) are served as-is.

## Layout

```
index.html
css/styles.css
js/
  app.js              UI for all four views
  pieces.js           piece registry, default shapes, geometry helpers
  solver.worker.js    backtracking solver (Web Worker)
pieces.json           reference snapshot of the user-defined shapes
```
