import { ActiveHandler } from "./ActiveHandler.js";
import { Spreadsheet } from "./CanvasSperadSheet.js";
import { GridConfig } from "./config/GridConfig.js";
import { getCanvasCoords } from "./helpers/canvasCoords.js";
import { screenToGridCoords } from "./helpers/screenToGridCoords.js";
import ColumnResizeManager from "./managers/ResizeManager/ColumnResizeManager.js";
import RowResizeManager from "./managers/ResizeManager/RowResizeManager.js";
import ColumnSelectionManager from "./managers/SelectionManager/ColumnSelectionManager.js";
import RowSelectionManager from "./managers/SelectionManager/RowSelectionManager.js";
import SelectionManager from "./managers/SelectionManager/SelectionManager.js";
import SubGridSelectionManager from "./managers/SelectionManager/SubGridSelectionManager.js";
import { Point } from "./models/Point.js";
import { ResizeContext } from "./models/ResizeContext.js";

export class InputController {
    private handlers;
    private activeHandler: ActiveHandler = null;

    constructor(private app: Spreadsheet, selectionManager: SelectionManager, colResizeManager: ColumnResizeManager, rowResizeManager: RowResizeManager) {
        this.handlers = [
            colResizeManager,
            rowResizeManager,
            new RowSelectionManager(selectionManager),
            new SubGridSelectionManager(selectionManager),
            new ColumnSelectionManager(selectionManager),
        ];
    }

    public init(canvas: HTMLCanvasElement, editor: HTMLInputElement) {
        window.addEventListener('resize', () => this.app.resizeCanvas());

        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e, canvas));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e, canvas));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e, canvas));
        canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e, canvas));

        canvas.addEventListener('wheel', (e: WheelEvent) => this.handleWheel(e, canvas), { passive: false });

        editor.addEventListener('keydown', (e) => this.handleEditorKeyDown(e));
        editor.addEventListener('blur', () => this.app.commitEdit());


        document.addEventListener('keydown', (e: KeyboardEvent) => this.handleGlobalKeyDown(e));
    }


    private handleMouseDown(e: MouseEvent, canvas: HTMLCanvasElement): void {
        if (e.button !== 0) return;

        const { x, y } = getCanvasCoords(e, canvas);

        const coords = screenToGridCoords(e.clientX, e.clientY, canvas, this.app.colOffsets, this.app.rowOffsets, this.app.scrollManager);

        if (!coords) return;

        for (const handler of this.handlers) {
            if (handler.hitTest(x, y)) {
                this.activeHandler = handler;
                this.activeHandler.handleMouseDown(e);
                break;
            }
        }
        this.app.draw();
    }

    private handleMouseMove(e: MouseEvent, canvas: HTMLCanvasElement) {
        const { x, y } = getCanvasCoords(e, canvas);
        if (this.activeHandler) {
            this.activeHandler.handleMouseMove(e);
            this.app.draw();
        }

        this.app.draw();
    }

    private handleMouseUp(e: MouseEvent, canvas: HTMLCanvasElement): void {
        this.activeHandler?.handleMouseUp();
        this.activeHandler = null;
        this.app.draw();
    }

    private handleDoubleClick(e: MouseEvent, canvas: HTMLCanvasElement) {
        const activeCell: null | Point = this.app.selectionManager.getActiveCell();
        if (activeCell) {
            this.app.scrollManager.scrollToCell(activeCell.row, activeCell.col, this.app.colOffsets, this.app.rowOffsets, this.app.grid, this.app.selectionMetricsManager.computeSelectionMetrics() != null);
            this.app.draw();
            this.app.startEditingAtCell(activeCell);
        }

    }

    private handleWheel(e: WheelEvent, canvas: HTMLCanvasElement) {
        this.app.commitEdit();
        e.preventDefault();
        let deltaX = e.deltaX;
        let deltaY = e.deltaY;

        if (e.shiftKey) {
            deltaX += e.deltaY;
            deltaY = 0;
        }

        const nextX = this.app.scrollManager.scrollX + deltaX;
        const nextY = this.app.scrollManager.scrollY + deltaY;

        this.app.scrollManager.setScroll(nextX, nextY, this.app.grid);
        this.app.draw();
    }

    private handleEditorKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") this.app.commitEdit();
        else if (e.key === "Escape") this.app.cancelEdit();
    }


    private handleGlobalKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.isContentEditable) return;

        const activeCell = this.app.selectionManager.getActiveCell();

        if (e.ctrlKey || e.metaKey) {
            if (e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.app.historyManager.undo();
                this.app.draw();
            } else if (e.key.toLowerCase() === 'y') {
                e.preventDefault();
                this.app.historyManager.redo();
                this.app.draw();
            }
        } else if (e.key.length === 1 && activeCell) {
            this.app.scrollManager.scrollToCell(activeCell.row, activeCell.col, this.app.colOffsets, this.app.rowOffsets, this.app.grid, this.app.selectionMetricsManager.computeSelectionMetrics()!=null);
            this.app.startEditingAtCell(activeCell);
        }
        else if (e.key === 'Enter' && activeCell) {
            this.app.startEditingAtCell(activeCell);
            e.preventDefault();
        } else if ((e.key === 'Backspace' || e.key === 'Delete') && activeCell) {
            this.app.handleDeleteCell();
            this.app.draw();
        }

        if (!activeCell) return;

        let handled = false;

        switch (e.key) {
            case 'ArrowUp':
                if (activeCell.row > 0) activeCell.row--;
                handled = true;
                break;
            case 'ArrowDown':
                if (activeCell.row < GridConfig.MAX_ROWS - 1) activeCell.row++;
                handled = true;
                break;
            case 'ArrowLeft':
                if (activeCell.col > 0) activeCell.col--;
                handled = true;
                break;
            case 'ArrowRight':
                if (activeCell.col < GridConfig.MAX_COLS - 1) activeCell.col++;
                handled = true;
                break;
        }

        if (handled) {
            this.app.scrollManager.scrollToCell(activeCell.row, activeCell.col, this.app.colOffsets, this.app.rowOffsets, this.app.grid, this.app.selectionMetricsManager.computeSelectionMetrics()!=null);
            this.app.selectionManager.startSelection(activeCell.col, activeCell.row);
        }
        this.app.draw();
    }
}