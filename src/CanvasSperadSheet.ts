import FenwickTree from "./DataStructures/FenwickTree.js";
import type { CellData } from "./models/CellData.js";
import type { Point } from "./models/Point.js";
import type { HistoryItem } from "./models/HistoryItem.js";
import type { ResizeHit } from "./models/ResizeHit.js";
import { CellManager } from "./managers/CellManager.js";
import { SelectionManager } from "./managers/SelectionManager.js";
import { ScrollManager } from "./managers/ScrollManager.js";
import { GridRenderer } from "./Rendering/GridRenderer.js";
import { CellRenderer } from "./Rendering/CellRenderer.js";
import { HeaderRenderer } from "./Rendering/HeaderRenderer.js";
// import { SelectionRenderer } from "./Rendering/SelectionRenderer.js";
import { GridConfig } from "./config/GridConfig.js";
import type { GridModel } from "./models/GridModel.js";
import { CanvasGrid } from "./CanvasGrid.js";

export class Spreadsheet {
    private readonly grid: GridModel;
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;

    private readonly cellManager: CellManager;
    private readonly selectionManager: SelectionManager;
    private readonly scrollManager: ScrollManager;

    private readonly cellRenderer: CellRenderer;
    private readonly headerRenderer: HeaderRenderer;
    // private readonly selectionRenderer: SelectionRenderer;
    private readonly gridRenderer: GridRenderer;

    private readonly editor: HTMLInputElement;

    private readonly colOffsets: FenwickTree;
    private readonly rowOffsets: FenwickTree;

    private editingCell: Point | null = null;
    private isMouseDown = false;

    // Row / Column resizing boundary track layouts
    private isResizing = false;
    private resizeType: 'col' | 'row' | null = null;
    private resizeIndex = -1;
    private resizeStartSize = 0;
    private resizeStartPos = 0;
    private readonly resizeThreshold = 5;

    constructor(canvas: HTMLCanvasElement, editor: HTMLInputElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;

        this.cellManager = new CellManager();
        this.selectionManager = new SelectionManager();
        this.scrollManager = new ScrollManager();

        // 1. Instantiate 100,000 rows x 500 cols capacity vectors
        this.colOffsets = new FenwickTree(GridConfig.MAX_COLS + 1);
        this.rowOffsets = new FenwickTree(GridConfig.MAX_ROWS + 1);

        const { colWidths, rowHeights } = this.initializeGeometry();

        // 2. Wire single source grid wrapper context bounds
        this.grid = new CanvasGrid(this.ctx, this.cellManager, this.selectionManager, {
            startRow: 0,
            endRow: GridConfig.MAX_ROWS,
            startCol: 0,
            endCol: GridConfig.MAX_COLS,
            rowHeights: rowHeights,
            colWidths: colWidths,
            headerWidth: GridConfig.HEADER_WIDTH || 50,
            headerHeight: GridConfig.HEADER_HEIGHT || 25
        });

        this.cellRenderer = new CellRenderer(this.ctx);
        this.headerRenderer = new HeaderRenderer(this.ctx);
        // this.selectionRenderer = new SelectionRenderer(this.ctx);
        this.gridRenderer = new GridRenderer(this.cellRenderer, this.headerRenderer);

        this.editor = editor;

        this.setupEvents();
        this.resizeCanvas();
        this.draw();
    }

    private initializeGeometry(): { colWidths: number[], rowHeights: number[] } {
        const colWidths: number[] = [];
        const rowHeights: number[] = [];

        for (let c = 0; c < GridConfig.MAX_COLS; c++) {
            const width = GridConfig.CELL_WIDTH || 100;
            colWidths.push(width);
            this.colOffsets.add(c + 1, width);
        }

        for (let r = 0; r < GridConfig.MAX_ROWS; r++) {
            const height = GridConfig.CELL_HEIGHT || 25;
            rowHeights.push(height);
            this.rowOffsets.add(r + 1, height);
        }

        return { colWidths, rowHeights };
    }

    private resizeCanvas(): void {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.ctx.scale(dpr, dpr);

        this.scrollManager.updateMetrics(
            window.innerWidth,
            window.innerHeight,
            this.colOffsets,
            this.rowOffsets,
            GridConfig.MAX_COLS,
            GridConfig.MAX_ROWS,
            this.grid.headerWidth,
            this.grid.headerHeight
        );

        this.draw();
    }

    private setupEvents(): void {
        window.addEventListener('resize', () => this.resizeCanvas());

        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        this.editor.addEventListener('keydown', (e) => this.onEditorKeyDown(e));
        this.editor.addEventListener('blur', () => this.commitEdit());
        this.canvas.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault(); // Stop standard page body movement

    // Compute proposed new layout coordinates
    const nextX = this.scrollManager.scrollX + e.deltaX;
    const nextY = this.scrollManager.scrollY + e.deltaY;

    // Apply clamped updates
    this.scrollManager.setScroll(nextX, nextY, this.grid);

    // Request animation frame layout redraw
    this.gridRenderer.render(this.grid, this.scrollManager, this.colOffsets, this.rowOffsets);
}, { passive: false });
    }

    private screenToGridCoords(screenX: number, screenY: number): Point | null {
        const rect = this.canvas.getBoundingClientRect();
        const x = screenX - rect.left - this.grid.headerWidth + this.scrollManager.scrollX;
        const y = screenY - rect.top - this.grid.headerHeight + this.scrollManager.scrollY;

        if (screenX - rect.left < this.grid.headerWidth || screenY - rect.top < this.grid.headerHeight) {
            return null;
        }

        const col = this.colOffsets.lowerBound(x);
        const row = this.rowOffsets.lowerBound(y);

        if (col >= GridConfig.MAX_COLS || row >= GridConfig.MAX_ROWS || col < 0 || row < 0) {
            return null;
        }

        return { col: col, row: row };
    }

    private checkResizeHit(x: number, y: number): ResizeHit | null {
        if (y < this.grid.headerHeight && x >= this.grid.headerWidth) {
            const virtualX = x - this.grid.headerWidth + this.scrollManager.scrollX;
            const col = this.colOffsets.lowerBound(virtualX);
            const edgeX = this.grid.getCellX(col + 1) - this.scrollManager.scrollX;
            if (Math.abs(x - edgeX) <= this.resizeThreshold) {
                return { type: 'col', index: col };
            }
        }
        
        if (x < this.grid.headerWidth && y >= this.grid.headerHeight) {
            const virtualY = y - this.grid.headerHeight + this.scrollManager.scrollY;
            const row = this.rowOffsets.lowerBound(virtualY);
            const edgeY = this.grid.getCellY(row + 1) - this.scrollManager.scrollY;
            if (Math.abs(y - edgeY) <= this.resizeThreshold) {
                return { type: 'row', index: row };
            }
        }
        return null;
    }

    private onMouseDown(e: MouseEvent): void {
        if (e.button !== 0) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Process potential cell resize interaction triggers
        const hit = this.checkResizeHit(x, y);
        if (hit) {
            this.isResizing = true;
            this.resizeType = hit.type;
            this.resizeIndex = hit.index;
            this.resizeStartPos = hit.type === 'col' ? e.clientX : e.clientY;
            this.resizeStartSize = hit.type === 'col'
                ? this.grid.colWidths[hit.index]
                : this.grid.rowHeights[hit.index];
            this.commitEdit();
            return;
        }

        this.isMouseDown = true;
        this.commitEdit();

        const cellPos = this.screenToGridCoords(e.clientX, e.clientY);
        if (!cellPos) return;

        this.selectionManager.startSelection(cellPos.col, cellPos.row);
        this.draw();
    }

    private onMouseMove(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 1. Handle live column or row resize dragging operations
        if (this.isResizing && this.resizeType) {
            if (this.resizeType === 'col') {
                const delta = e.clientX - this.resizeStartPos;
                const newWidth = Math.max(30, this.resizeStartSize + delta);
                const currentWidth = this.grid.colWidths[this.resizeIndex];
                this.grid.colWidths[this.resizeIndex] = newWidth;
                this.colOffsets.add(this.resizeIndex + 1, newWidth - currentWidth);
            } else {
                const delta = e.clientY - this.resizeStartPos;
                const newHeight = Math.max(18, this.resizeStartSize + delta);
                const currentHeight = this.grid.rowHeights[this.resizeIndex];
                this.grid.rowHeights[this.resizeIndex] = newHeight;
                this.rowOffsets.add(this.resizeIndex + 1, newHeight - currentHeight);
            }

            // Re-sync scroll clamp boundaries dynamically during resize interactions
            this.scrollManager.updateMetrics(
                window.innerWidth, window.innerHeight,
                this.colOffsets, this.rowOffsets,
                GridConfig.MAX_COLS, GridConfig.MAX_ROWS,
                this.grid.headerWidth, this.grid.headerHeight
            );
            this.draw();
            return;
        }

        // 2. Manage canvas cursor hover icon changes over boundary lines
        const hit = this.checkResizeHit(x, y);
        if (hit) {
            this.canvas.style.cursor = hit.type === 'col' ? 'col-resize' : 'row-resize';
        } else {
            this.canvas.style.cursor = 'default';
        }

        // 3. Process active select drag bounding box expansion loops
        if (!this.isMouseDown) return;
        const cellPos = this.screenToGridCoords(e.clientX, e.clientY);
        if (!cellPos) return;

        this.selectionManager.updateSelection(cellPos.col, cellPos.row);
        this.draw();
    }

    private onMouseUp(e: MouseEvent): void {
        this.isMouseDown = false;
        this.isResizing = false;
        this.resizeType = null;
    }

    private onDoubleClick(e: MouseEvent): void {
        const cellPos = this.screenToGridCoords(e.clientX, e.clientY);
        if (!cellPos) return;

        this.editingCell = cellPos;
        this.beginEdit();
    }

    private onWheel(e: WheelEvent): void {
        e.preventDefault();
        this.scrollManager.scroll(e.deltaX, e.deltaY);
        this.draw();

        if (this.editingCell) {
            this.beginEdit(); // Keeps overlay perfectly pinned if scrolling while editing
        }
    }


    private onEditorKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Enter') {
            this.commitEdit();
            this.canvas.focus();
        } else if (e.key === 'Escape') {
            this.cancelEdit();
            this.canvas.focus();
        }
    }

    private beginEdit(): void {
        if (!this.editingCell) return;

        const cellData = this.cellManager.getCell(this.editingCell.col, this.editingCell.row);
        const x = this.grid.getCellX(this.editingCell.col) - this.scrollManager.scrollX;
        const y = this.grid.getCellY(this.editingCell.row) - this.scrollManager.scrollY;
        const w = this.grid.colWidths[this.editingCell.col];
        const h = this.grid.rowHeights[this.editingCell.row];

        this.editor.value = cellData?.value || "";
        this.editor.style.left = `${this.canvas.offsetLeft + x}px`;
        this.editor.style.top = `${this.canvas.offsetTop + y}px`;
        this.editor.style.width = `${w}px`;
        this.editor.style.height = `${h}px`;
        this.editor.style.display = "block";

        setTimeout(() => this.editor.focus(), 0);
    }

    private commitEdit(): void {
        if (!this.editingCell) return;

        this.cellManager.setCell(this.editingCell.col, this.editingCell.row, {
            value: this.editor.value
        });

        this.editor.style.display = "none";
        this.editingCell = null;
        this.draw();
    }

    private cancelEdit(): void {
        this.editor.style.display = "none";
        this.editingCell = null;
        this.draw();
    }

    private draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();

        // Triggers optimized sub-region grid virtualization routine
        this.gridRenderer.render(
            this.grid,
            this.scrollManager,
            this.colOffsets,
            this.rowOffsets
        );

        this.ctx.restore();
    }
}
