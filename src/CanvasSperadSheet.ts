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
import { SelectionMetricsManager } from "./managers/SelectionMetricsManager.js";
import { InputController } from "./InputController.js";
import { FormulaManager } from "./managers/FormulaManager.js";
import { DataLoader } from "./services/DataLoader.js";
import { JSONDataLoader } from "./services/JSONDataLoader.js";

export class Spreadsheet {
    public readonly grid: GridModel;
    private readonly canvas: HTMLCanvasElement;
    private readonly statusBar: HTMLDivElement;
    private readonly ctx: CanvasRenderingContext2D;

    public readonly cellManager: CellManager;
    public readonly selectionManager: SelectionManager;
    public readonly selectionMetricsManager: SelectionMetricsManager;
    public readonly scrollManager: ScrollManager;
    public readonly resizeManager: ResizeManager;
    public readonly historyManager: HistoryManager;
    private readonly formulaManager: FormulaManager;

    private readonly cellRenderer: CellRenderer;
    private readonly headerRenderer: HeaderRenderer;
    private readonly gridRenderer: GridRenderer;
    private readonly selectionRenderer: SelectionRenderer;
    
    private readonly InputController: InputController;

    private readonly dataLoader: DataLoader;

    private readonly editor: HTMLInputElement;

    public readonly colOffsets: FenwickTree;
    public readonly rowOffsets: FenwickTree;

    private editingCell: Point | null = null;

    constructor(canvas: HTMLCanvasElement, editor: HTMLInputElement, statusBar: HTMLDivElement) {
        this.canvas = canvas;
        this.statusBar = statusBar;
        this.ctx = canvas.getContext("2d")!;

        this.InputController = new InputController(this);
        this.cellManager = new CellManager();
        this.selectionManager = new SelectionManager();
        this.scrollManager = new ScrollManager();
        this.resizeManager = new ResizeManager();
        this.historyManager = new HistoryManager();
        this.formulaManager = new FormulaManager(this.cellManager);
        this.selectionMetricsManager = new SelectionMetricsManager(this.selectionManager, this.cellManager);

        this.colOffsets = new FenwickTree(GridConfig.MAX_COLS + 1);
        this.rowOffsets = new FenwickTree(GridConfig.MAX_ROWS + 1);

        this.dataLoader = new JSONDataLoader(this.formulaManager);

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

        this.cellRenderer = new CellRenderer(this.ctx, this.formulaManager);
        this.headerRenderer = new HeaderRenderer(this.ctx);
        this.selectionRenderer = new SelectionRenderer(this.ctx);
        this.gridRenderer = new GridRenderer(this.cellRenderer, this.headerRenderer, this.selectionRenderer);

        this.editor = editor;
        this.InputController.init(canvas, editor);

        this.resizeCanvas();
        this.draw();
    }

    public async loadInitialData(): Promise<void> {
        await this.dataLoader.load(
            this.cellManager,
        );
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

    public resizeCanvas(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

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


    public screenToGridCoords(screenX: number, screenY: number): Point | null {
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

    public startEditingAtCell(coords: Point): void {
        this.editingCell = coords;
        const cellData = this.cellManager.getCell(coords.col, coords.row);

        const x = this.grid.getCellX(coords.col) - this.scrollManager.scrollX;
        const y = this.grid.getCellY(coords.row) - this.scrollManager.scrollY;

        this.editor.value = cellData ? cellData.value : "";
        this.editor.style.left = `${x}px`;
        this.editor.style.top = `${y}px`;
        this.editor.style.width = `${this.grid.colWidths[coords.col]}px`;
        this.editor.style.height = `${this.grid.rowHeights[coords.row]}px`;
        this.editor.style.display = "block";
        this.editor.focus();
    }

    public commitEdit(): void {
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

    public cancelEdit(): void {
        this.editor.style.display = "none";
        this.editingCell = null;
        this.draw();
    }

    public commitResizeHistory(type: 'col' | 'row', index: number, startSize: number): void {
        if (type === 'col') {
            const finalWidth = this.grid.colWidths[index]!;
            if (finalWidth !== startSize) {
                const command = new ResizeColumnCommand(this.resizeManager, index, finalWidth, startSize, this.grid.colWidths, this.colOffsets);
                this.historyManager.executeCommand(command);
            }
        } else {
            const finalHeight = this.grid.rowHeights[index]!;
            if (finalHeight !== startSize) {
                const command = new ResizeRowCommand(this.resizeManager, index, finalHeight, startSize, this.grid.rowHeights, this.rowOffsets);
                this.historyManager.executeCommand(command);
            }
        }
    }


    public draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gridRenderer.render(this.grid, this.scrollManager, this.colOffsets, this.rowOffsets);
        const metrics = this.selectionMetricsManager.computeSelectionMetrics();

        if (metrics) {
            document.getElementById("metricAverage")!.innerText = `Average: ${metrics.average.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
            document.getElementById("metricCount")!.innerText = `Count: ${metrics.count.toLocaleString()}`;
            document.getElementById("metricMin")!.innerText = `Min: ${metrics.min.toLocaleString()}`;
            document.getElementById("metricMax")!.innerText = `Max: ${metrics.max.toLocaleString()}`;
            document.getElementById("metricSum")!.innerText = `Sum: ${metrics.sum.toLocaleString()}`;
            this.statusBar.style.display = "flex";
        } else {
            this.statusBar.style.display = "none";
        }
    }
}