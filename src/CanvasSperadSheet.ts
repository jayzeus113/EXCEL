import FenwickTree from "./DataStructures/FenwickTree.js";
import type { Point } from "./models/Point.js";
import { CellManager } from "./managers/CellManager.js";
import SelectionManager from './managers/SelectionManager/SelectionManager.js'
import { ScrollManager } from "./managers/ScrollManager.js";
import { GridRenderer } from "./Rendering/GridRenderer.js";
import { CellRenderer } from "./Rendering/CellRenderer.js";
import { HeaderRenderer } from "./Rendering/HeaderRenderer.js";
import { GridConfig } from "./config/GridConfig.js";
import type { GridModel } from "./models/GridModel.js";
import { CanvasGrid } from "./CanvasGrid.js";
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
import ColumnResizeManager from "./managers/ResizeManager/ColumnResizeManager.js";
import RowResizeManager from "./managers/ResizeManager/RowResizeManager.js";
import { ResizeContext } from "./models/ResizeContext.js";

export class Spreadsheet {
    public readonly grid: GridModel;
    public readonly canvas: HTMLCanvasElement;
    private readonly statusBar: HTMLDivElement;
    private readonly ctx: CanvasRenderingContext2D;

    public readonly cellManager: CellManager;
    public readonly selectionManager: SelectionManager;
    public readonly selectionMetricsManager: SelectionMetricsManager;
    public readonly scrollManager: ScrollManager;
    private readonly colResizeManager: ColumnResizeManager;
    private readonly rowResizeManager: RowResizeManager;
    public readonly historyManager: HistoryManager;
    public readonly formulaManager: FormulaManager;

    private readonly cellRenderer: CellRenderer;
    private readonly headerRenderer: HeaderRenderer;
    private readonly gridRenderer: GridRenderer;
    private readonly selectionRenderer: SelectionRenderer;

    private readonly InputController: InputController;

    private readonly dataLoader: DataLoader;

    private readonly editor: HTMLInputElement;

    public readonly colOffsets: FenwickTree;
    public readonly rowOffsets: FenwickTree;

    public readonly rowHeights:number[];
    public readonly colWidths:number[];


    private editingCell: Point | null = null;

    constructor(canvas: HTMLCanvasElement, editor: HTMLInputElement, statusBar: HTMLDivElement) {
        this.canvas = canvas;
        this.statusBar = statusBar;
        this.ctx = canvas.getContext("2d")!;
        
        this.colOffsets = new FenwickTree(GridConfig.MAX_COLS + 1);
        this.rowOffsets = new FenwickTree(GridConfig.MAX_ROWS + 1);

        this.colWidths = [];
        this.rowHeights = [];

        this.initializeGeometry();

        const context: ResizeContext = { rowOffsets: this.rowOffsets,  colOffsets: this.colOffsets, heights: this.rowHeights, widths: this.colWidths, canvas: this.canvas };
        


        this.cellManager = new CellManager();
        this.scrollManager = new ScrollManager();
        
        this.historyManager = new HistoryManager();
        this.selectionManager = new SelectionManager(canvas, this.colOffsets, this.rowOffsets, this.scrollManager);
        this.colResizeManager = new ColumnResizeManager(context, this.historyManager, this.scrollManager);
        this.rowResizeManager = new RowResizeManager(context, this.historyManager, this.scrollManager);
        this.InputController = new InputController(this, this.selectionManager, this.colResizeManager, this.rowResizeManager);
        this.formulaManager = new FormulaManager(this.cellManager);
        this.selectionMetricsManager = new SelectionMetricsManager(this.selectionManager, this.cellManager);
        
        this.dataLoader = new JSONDataLoader(this.formulaManager);


        this.grid = new CanvasGrid(this.ctx, this.cellManager, this.selectionManager, {
            startRow: 0,
            endRow: GridConfig.MAX_ROWS,
            startCol: 0,
            endCol: GridConfig.MAX_COLS,
            rowHeights: this.rowHeights,
            colWidths: this.colWidths,
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

    private initializeGeometry(): void {

        for (let c = 0; c < GridConfig.MAX_COLS; c++) {
            const width = GridConfig.CELL_WIDTH || 100;
            this.colWidths.push(width);
            this.colOffsets.add(c + 1, width);
        }

        for (let r = 0; r < GridConfig.MAX_ROWS; r++) {
            const height = GridConfig.CELL_HEIGHT || 25;
            this.rowHeights.push(height);
            this.rowOffsets.add(r + 1, height);
        }
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

    public handleDeleteCell(): void {

        const activeCell = this.selectionManager.getActiveCell();
        if(!activeCell) return;
        
        const col = activeCell.col, row = activeCell.row;
        const oldCellData = this.cellManager.getCell(col, row);
        const command = new UpdateCellCommand(
            this.cellManager,
            col,
            row,
            { value: ""},
            oldCellData
        );
        this.historyManager.executeCommand(command);
    }

    public cancelEdit(): void {
        this.editor.style.display = "none";
        this.editingCell = null;
        this.draw();
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