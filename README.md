# Canvas Spreadsheet (Excel Grid View)

A high-performance, Excel-like grid built with **TypeScript**, **HTML5 Canvas**, and the **Command pattern**. Renders large datasets (100,000 rows × 500 columns) using virtual/viewport rendering instead of DOM-per-cell, with support for editing, resizing, selection, range summaries, and undo/redo.


---

## Features Implemented

- Canvas-based grid rendering with row/column headers and gridlines
- Virtual rendering — only the visible viewport is drawn (via `ScrollManager` + `FenwickTree` offset lookups)
- Cell editing via an HTML `<input>` overlay positioned over the active cell
- Column and row resizing, with live drag handling in `InputController` / `ResizeManager`
- Row selection, column selection, and range selection (`SelectionManager`)
- Selection summary bar (count, min, max, sum, average) rendered as real HTML text below the canvas (`SelectionMetricsManager`)
- Undo/redo via Command pattern (`HistoryManager` + `Command` implementations for cell edits, column resize, row resize)
- JSON data loading (`JSONDataLoader` / `DataLoader`)
- Keyboard input handling (`InputController`) The InputController class is responsible for managing all user interactions within the HTML5 Canvas-based spreadsheet ecosystem. It bridges native browser event listeners (mouse, keyboard, window, and wheel events) with the internal application core (Spreadsheet) to coordinate actions like cell selection, row/column resizing, scrolling, and content editing.Core ResponsibilitiesCanvas Coordination: Tracks absolute screen coordinates and maps them to grid coordinates (col and row) using the active scroll viewport metrics.Selection Management: Orchestrates single cell targets, continuous multi-cell ranges, and complete header-bound row or column highlights.Row/Column Resizing: Identifies hover boundary "hits", alters the canvas cursor state (col-resize or row-resize), handles live layout modifications, and saves size records back to history.Editing State Engine: Evaluates global keystrokes to spin up in-place text editors, commits active edits upon standard key triggers or blurred focus, and aborts adjustments elegantly.Grid Navigation & History Control: Governs arrow key tracking across grid cells while intercepting native OS hotkeys (Ctrl/Cmd + Z / Ctrl/Cmd + Y) to invoke immediate Undo and Redo routines.

---

## Setup & Run

```bash
npm install
npm run compile   # tsc --watch, compiles src/ -> dist/
```

Then open `src/index.html` in a browser (served via a local static server, e.g. `npx serve .` or the VS Code Live Server extension — `dist/index.js` is loaded relative to `index.html`).

**Requirements:** Node.js, TypeScript ^6.0.3.

`tsconfig.json` compiles `src/**/*.ts` → `dist/`, target `ES2020`, `module: ESNext`, `strict: true`.

---

## Folder & Class Structure

```
src/
├── CanvasGrid.ts            # Grid geometry + cell lookups (implements GridModel)
├── CanvasSperadSheet.ts      # Spreadsheet — main coordinator/orchestrator
├── InputController.ts       # Mouse/keyboard/wheel event handling
├── index.ts / index.html    # App bootstrap
├── style.css
├── commands/
│   ├── Command.ts               # ICommand contract (execute/undo)
│   ├── ResizeColumnCommand.ts
│   ├── ResizeRowCommand.ts
│   └── UpdateCellCommand.ts
├── config/
│   └── GridConfig.ts         # Constants: MAX_ROWS, MAX_COLS, CELL_WIDTH/HEIGHT, HEADER sizes
├── DataStructures/
│   └── FenwickTree.ts        # Binary indexed tree for O(log n) row/col offset + lowerBound lookups
├── managers/
│   ├── CellManager.ts            # Cell data storage/retrieval
│   ├── FormulaManager.ts         # Formula/value resolution for cells
│   ├── HistoryManager.ts         # Undo/redo stack, executes ICommand instances
│   ├── ResizeManager.ts          # Hit-testing for column/row resize handles
│   ├── ScrollManager.ts          # Viewport metrics & scroll position
│   ├── SelectionManager.ts       # Active cell / row / column / range selection state
│   └── SelectionMetricsManager.ts # Computes count/min/max/sum/avg for current selection
├── models/                   # Type definitions: CellData, CellState, GridModel, SelectionRange, etc.
├── Rendering/
│   ├── GridRenderer.ts        # Orchestrates the render pass
│   ├── CellRenderer.ts        # Draws cell contents
│   ├── HeaderRenderer.ts      # Draws row/column headers
│   └── SelectionRenderer.ts   # Draws selection highlight & active cell outline
└── services/
    ├── DataLoader.ts          # Abstract/base data loading contract
    └── JSONDataLoader.ts      # Loads dataset.json into CellManager via FormulaManager
```

---

## How OOP & SOLID Are Applied

| Principle | Where |
|---|---|
| **Single Responsibility** | Rendering (`Rendering/*`), selection (`SelectionManager`), editing (`InputController` + `CanvasSperadSheet.commitEdit`), history (`HistoryManager`), and data access (`CellManager`) are all separated into distinct classes. |
| **Open/Closed** | New actions are added as new `Command` implementations (e.g. `UpdateCellCommand`, `ResizeColumnCommand`) without modifying `HistoryManager`. |
| **Liskov Substitution** | `CanvasGrid implements GridModel`, so any `GridModel`-typed consumer works against the interface, not the concrete class. |
| **Interface Segregation** | `Command`/`ICommand` exposes only `execute`/`undo`; `DataLoader` exposes only the loading contract that `JSONDataLoader` implements. |
| **Dependency Inversion** | `Spreadsheet` composes managers/renderers via constructor injection (e.g. `CanvasGrid` receives `CellManager` and `SelectionManager` as constructor args) rather than constructing its own dependencies internally. |

---

## Command Pattern & Undo/Redo

- `Command.ts` defines the shared `execute()` / `undo()` contract.
- `UpdateCellCommand` captures old and new cell data on construction (`CanvasSperadSheet.commitEdit`), so undo restores the previous value and redo reapplies the new one.
- `ResizeColumnCommand` / `ResizeRowCommand` capture the start size vs. final size (`CanvasSperadSheet.commitResizeHistory`) and mutate `colWidths`/`rowHeights` plus the corresponding `FenwickTree` offsets on execute/undo.
- `HistoryManager` maintains the undo/redo stacks and is the single place that invokes `execute`/`undo` — commands never mutate state directly outside of that call.

---

##  Virtual Rendering

- `ScrollManager.updateMetrics()` computes the visible viewport bounds from canvas size + scroll position.
- Row and column pixel offsets are tracked in two `FenwickTree` instances (`rowOffsets`, `colOffsets`), giving O(log n) cumulative-offset queries and `lowerBound` lookups — this is what lets `screenToGridCoords` map a mouse position to a (col, row) pair without iterating every prior row/column.
- `GridRenderer.render()` is called with the current scroll state on every redraw, and only draws headers/cells that fall inside the visible viewport rather than the full 100,000 × 500 grid.

---

## Data Generation & Loading

- `dataset.json` provides the seed dataset (records with `id`, `firstName`, `lastName`, `age`, `salary` fields — an "Employee"-shaped record per `models/Employee.ts`).
- `JSONDataLoader.load()` reads the dataset and populates `CellManager` via `FormulaManager`.
- `Spreadsheet.loadInitialData()` triggers the load after construction, then calls `draw()`.

---

## Selection Model

- `SelectionManager` tracks active cell, and row/column/range selection state; exposes `isSelected(c, r)` / `isActive(c, r)` used by both rendering and metrics.
- `selectEntireColumn` / `selectEntireRow` (invoked from `InputController` header clicks) set the corresponding selection mode.
- `SelectionRange` models a rectangular start/end selection used for range selection and summary computation.

---

##  Summary Calculation

- `SelectionMetricsManager.computeSelectionMetrics()` is called on every `draw()` and returns `{ count, min, max, sum, average }` (or `null` if nothing is selected).
- Results are written directly into HTML `<span>` elements in the status bar (`metricAverage`, `metricCount`, `metricMin`, `metricMax`, `metricSum`) — summary values are real HTML text outside the canvas, not drawn on the canvas itself, satisfying the accessibility requirement.

---

##  Accessibility Considerations

- Cell editing uses an HTML `<input id="cell-editor">` overlay rather than capturing keystrokes directly on the canvas.
- Summary metrics are rendered as HTML text, not canvas-drawn pixels, so they're screen-reader accessible.
- Canvas is a bitmap surface — grid content itself (cells, headers, selection) is **not** exposed to assistive technology. This is a known limitation of the canvas-based approach.
- `canvas` has `tabindex="0"` so it can receive keyboard focus.

---

##  Known Limitations

- Canvas grid content is not screen-reader accessible.
- Formulas support basic arithmetic only no functions (`SUM`, `AVERAGE`, etc.) and no range references (`A1:A10`).
- No copy/paste, no multi-sheet support, and no import/export beyond the initial bundled `data.json`.
 
- Formula results aren't cached, so complex formula chains re-evaluate on every render.
- Accessibility is minimal, as noted above the canvas-based approach trades off native accessibility for rendering control.

---

##  Next Improvements

- Introduce formula functions and range references.
- Cache formula evaluation results and invalidate only affected cells on edit.

---

##  Performance Observations
 
These are qualitative observations from working with the grid, not formal benchmarks:
 
- Scrolling stays smooth even near the configured limits (50,000 rows, 500 columns), because render cost is tied to the visible viewport rather than total sheet size the `FenwickTree` binary search keeps offset lookups cheap regardless of how far into the sheet you've scrolled.
- Resizing a column or row is O(log n) in the number of rows/columns *after* the resized one, since `fenwcikTree.set(index, value)` shifts every subsequent offset by the delta.
- Formula evaluation is recursive per cell reference and re-evaluates on every render rather than caching results, so a cell with many formula dependents, or a sheet with heavy formula use, would see rendering cost grow with formula complexity, there's no memoization or dirty-tracking yet.
 

---

##  Test Cases

- Scrolling to the far edges of the grid (row 50,000 / column 500) and back
- Editing a cell, then undoing and redoing that edit
- Resizing a column and a row, then undoing and redoing the resize
- Selecting a single cell, a dragged range, a full row, a full column, and the entire sheet
- Typing a formula referencing another cell, and referencing a cell that itself contains a formula (nested resolution)
- Creating a self-referencing/circular formula and confirming it resolves to `#CIRCULAR!` instead of hanging
- Deleting a cell's content with `Backspace`/`Delete` and confirming it's tracked in undo history
- Loading the bundled sample data on startup and confirming headers and values populate correctly
- Checking that the status bar updates correctly for a range containing a mix of numeric, blank, and non-numeric cells