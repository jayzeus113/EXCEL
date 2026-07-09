import FenwickTree from "./DataStructures/FenwickTree.js";
import type { Point } from "./models/Point.js";
import { CellManager } from "./managers/CellManager.js";
import { SelectionManager } from "./managers/SelectionManager.js";
import { ScrollManager } from "./managers/ScrollManager.js";
import { GridRenderer } from "./Rendering/GridRenderer.js";
import { CellRenderer } from "./Rendering/CellRenderer.js";
import { HeaderRenderer } from "./Rendering/HeaderRenderer.js";
import { GridConfig } from "./config/GridConfig.js";
import type { GridModel } from "./models/GridModel.js";
import { CanvasGrid } from "./CanvasGrid.js";
import { ResizeManager } from "./managers/ResizeManager.js";
import { HistoryManager } from "./managers/HistoryManager.js";
import { ResizeColumnCommand } from "./commands/ResizeColumnCommand.js";
import { ResizeRowCommand } from "./commands/ResizeRowCommand.js";
import { UpdateCellCommand } from "./commands/UpdateCellCommand.js";
import { SelectionRenderer } from "./Rendering/SelectionRenderer.js";
import { SelectionMetrics } from "./models/SelectionMetrics.js";

export class Spreadsheet {
    private readonly grid: GridModel;
    private readonly canvas: HTMLCanvasElement;
    private readonly statusBar: HTMLDivElement;
    private readonly ctx: CanvasRenderingContext2D;

    private readonly cellManager: CellManager;
    private readonly selectionManager: SelectionManager;
    private readonly scrollManager: ScrollManager;
    private readonly resizeManager: ResizeManager;
    private readonly historyManager: HistoryManager;

    private readonly cellRenderer: CellRenderer;
    private readonly headerRenderer: HeaderRenderer;
    private readonly gridRenderer: GridRenderer;
    private readonly selectionRenderer: SelectionRenderer;

    private readonly editor: HTMLInputElement;

    private readonly colOffsets: FenwickTree;
    private readonly rowOffsets: FenwickTree;

    private editingCell: Point | null = null;
    private isMouseDown = false;

    private isResizing = false;
    private resizeType: 'col' | 'row' | null = null;
    private resizeIndex = -1;
    private resizeStartSize = 0;
    private resizeStartPos = 0;

    constructor(canvas: HTMLCanvasElement, editor: HTMLInputElement, statusBar: HTMLDivElement) {
        this.canvas = canvas;
        this.statusBar = statusBar;
        this.ctx = canvas.getContext("2d")!;

        this.cellManager = new CellManager();
        this.selectionManager = new SelectionManager();
        this.scrollManager = new ScrollManager();
        this.resizeManager = new ResizeManager();
        this.historyManager = new HistoryManager();

        this.colOffsets = new FenwickTree(GridConfig.MAX_COLS + 1);
        this.rowOffsets = new FenwickTree(GridConfig.MAX_ROWS + 1);

        const { colWidths, rowHeights } = this.initializeGeometry();

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
        this.selectionRenderer = new SelectionRenderer(this.ctx);
        this.gridRenderer = new GridRenderer(this.cellRenderer, this.headerRenderer, this.selectionRenderer);

        this.editor = editor;

        this.setupEvents();
        this.resizeCanvas();
        this.draw();
    }

    public computeSelectionMetrics(): SelectionMetrics | null {
        const selections = this.selectionManager.getSelections();
        if (!selections || selections.length === 0) return null;

        let count = 0;
        let sum = 0;
        let min = Infinity;
        let max = -Infinity;

        const processedCells = new Set<string>();

        for (const range of selections) {
            const minCol = Math.min(range.start.col, range.end.col);
            const maxCol = Math.max(range.start.col, range.end.col);
            const minRow = Math.min(range.start.row, range.end.row);
            const maxRow = Math.max(range.start.row, range.end.row);

            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    const cellKey = `${r},${c}`;

                    if (processedCells.has(cellKey)) continue;
                    processedCells.add(cellKey);

                    const cellData = this.cellManager.getCell(c, r);
                    if (!cellData || !cellData.value) continue;

                    const trimmedValue = cellData.value.trim();
                    if (trimmedValue === "") continue;

                    const numericValue = Number(trimmedValue);

                    if (!isNaN(numericValue)) {
                        count++;
                        sum += numericValue;
                        if (numericValue < min) min = numericValue;
                        if (numericValue > max) max = numericValue;
                    }
                }
            }
        }
        if (count === 0) return null;

        return {
            count: count,
            min: min,
            max: max,
            sum: sum,
            average: sum / count
        };
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


        this.canvas.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();
            let deltaX = e.deltaX;
            let deltaY = e.deltaY;

            if (e.shiftKey) {
                console.log(deltaY);
                deltaX += deltaY;
                deltaY = 0;
            }
            const nextX = this.scrollManager.scrollX + deltaX
            const nextY = this.scrollManager.scrollY + deltaY;

            this.scrollManager.setScroll(nextX, nextY, this.grid);
            this.draw();
        }, { passive: false });

        this.editor.addEventListener('keydown', (e) => this.onEditorKeyDown(e));
        this.editor.addEventListener('blur', () => this.commitEdit());


        document.addEventListener('keydown', (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.historyManager.undo();
                this.draw();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                this.historyManager.redo();
                this.draw();
            }
        });
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

    private onMouseDown(e: MouseEvent): void {
        if (e.button !== 0) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const hit = this.resizeManager.getResizeHit(
            x,
            y,
            this.scrollManager.scrollX,
            this.scrollManager.scrollY,
            this.colOffsets,
            this.rowOffsets
        );

        if (hit) {
            this.isResizing = true;
            this.resizeType = hit.type;
            this.resizeIndex = hit.index;
            this.resizeStartPos = hit.type === 'col' ? e.clientX : e.clientY;
            this.resizeStartSize = hit.type === 'col'
                ? this.grid.colWidths[hit.index]!
                : this.grid.rowHeights[hit.index]!;
            return;
        }

        this.isMouseDown = true;
        const coords = this.screenToGridCoords(e.clientX, e.clientY);
        if (coords) {
            this.selectionManager.startSelection(coords.col, coords.row);
            this.draw();
        }
    }

    private onMouseMove(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;


        if (this.isResizing) {
            if (this.resizeType === 'col') {
                const deltaX = e.clientX - this.resizeStartPos;
                this.resizeManager.resizeColumn(
                    this.resizeIndex,
                    deltaX,
                    this.resizeStartSize,
                    this.grid.colWidths,
                    this.colOffsets
                );
            } else if (this.resizeType === 'row') {
                const deltaY = e.clientY - this.resizeStartPos;
                this.resizeManager.resizeRow(
                    this.resizeIndex,
                    deltaY,
                    this.resizeStartSize,
                    this.grid.rowHeights,
                    this.rowOffsets
                );
            }
            this.draw();
            return;
        }


        const hit = this.resizeManager.getResizeHit(
            x,
            y,
            this.scrollManager.scrollX,
            this.scrollManager.scrollY,
            this.colOffsets,
            this.rowOffsets
        );
        if (hit) {
            this.canvas.style.cursor = hit.type === 'col' ? 'col-resize' : 'row-resize';
        } else {
            this.canvas.style.cursor = 'default';
        }


        if (this.isMouseDown) {
            const coords = this.screenToGridCoords(e.clientX, e.clientY);
            if (coords) {
                this.selectionManager.updateSelection(coords.col, coords.row);
                this.draw();
            }
        }
    }

    private onMouseUp(e: MouseEvent): void {
        if (this.isResizing) {
            if (this.resizeType === 'col') {
                const finalWidth = this.grid.colWidths[this.resizeIndex]!;
                if (finalWidth !== this.resizeStartSize) {
                    const command = new ResizeColumnCommand(
                        this.resizeManager,
                        this.resizeIndex,
                        finalWidth,
                        this.resizeStartSize,
                        this.grid.colWidths,
                        this.colOffsets
                    );
                    this.historyManager.executeCommand(command);
                }
            }
            else if (this.resizeType === 'row') {
                const finalHeight = this.grid.rowHeights[this.resizeIndex]!;
                if (finalHeight !== this.resizeStartSize) {
                    const command = new ResizeRowCommand(
                        this.resizeManager,
                        this.resizeIndex,
                        finalHeight,
                        this.resizeStartSize,
                        this.grid.rowHeights,
                        this.rowOffsets
                    );
                    this.historyManager.executeCommand(command);
                }
            }
        }

        this.isMouseDown = false;
        this.isResizing = false;
        this.resizeType = null;
        this.resizeIndex = -1;
    }

    private onDoubleClick(e: MouseEvent): void {
        const coords = this.screenToGridCoords(e.clientX, e.clientY);
        if (!coords) return;

        this.editingCell = coords;
        const cellData = this.cellManager.getCell(coords.col, coords.row);

        const x = this.grid.getCellX(coords.col) - this.scrollManager.scrollX;
        //  this.grid.headerWidth;
        const y = this.grid.getCellY(coords.row) - this.scrollManager.scrollY;
        // this.grid.headerHeight;

        this.editor.value = cellData ? cellData.value : "";
        this.editor.style.left = `${x}px`;
        this.editor.style.top = `${y}px`;
        this.editor.style.width = `${this.grid.colWidths[coords.col]}px`;
        this.editor.style.height = `${this.grid.rowHeights[coords.row]}px`;
        this.editor.style.display = "block";
        this.editor.focus();
    }

    private onEditorKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            this.commitEdit();

        } else if (e.key === "Escape") {
            this.editor.style.display = "none";
            this.editingCell = null;
        }
    }

    private commitEdit(): void {
        if (!this.editingCell) return;

        const { col, row } = this.editingCell;
        const value = this.editor.value;
        const oldCellData = this.cellManager.getCell(col, row);

        if (!oldCellData || oldCellData.value !== value) {
            const command = new UpdateCellCommand(
                this.cellManager,
                col,
                row,
                { value },
                oldCellData
            );
            this.historyManager.executeCommand(command);
        }

        this.editor.style.display = "none";
        this.editingCell = null;
        this.draw();
    }

    public draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gridRenderer.render(this.grid, this.scrollManager, this.colOffsets, this.rowOffsets);
        const metrics = this.computeSelectionMetrics();

        if (metrics) {
            document.getElementById("metricAverage")!.innerText = `Average: ${metrics.average.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
            document.getElementById("metricCount")!.innerText = `Count: ${metrics.count}`;
            document.getElementById("metricMin")!.innerText = `Min: ${metrics.min}`;
            document.getElementById("metricMax")!.innerText = `Max: ${metrics.max}`;
            document.getElementById("metricSum")!.innerText = `Sum: ${metrics.sum.toLocaleString()}`;
            this.statusBar.style.display = "flex";
        } else {
            this.statusBar.style.display = "none";
        }

    }
}

