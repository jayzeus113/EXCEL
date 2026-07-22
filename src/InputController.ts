import { ActiveHandler } from "./ActiveHandler.js";
import { Spreadsheet } from "./CanvasSperadSheet.js";
import { GridConfig } from "./config/GridConfig.js";
import { getCanvasCoords } from "./helpers/canvasCoords.js";
import { screenToGridCoords } from "./helpers/screenToGridCoords.js";
import ColumnResizeManager from "./managers/ResizeManager/ColumnResizeManager.js";
// import { ResizeManager } from "./managers/ResizeManager/ResizeManager.js";
import RowResizeManager from "./managers/ResizeManager/RowResizeManager.js";
import ColumnSelectionManager from "./managers/SelectionManager/ColumnSelectionManager.js";
import RowSelectionManager from "./managers/SelectionManager/RowSelectionManager.js";
import SelectionManager from "./managers/SelectionManager/SelectionManager.js";
// import SelectionManager from "./managers/SelectionManager/SelectionManager.js";
import SubGridSelectionManager from "./managers/SelectionManager/SubGridSelectionManager.js";
import { Point } from "./models/Point.js";
import { ResizeContext } from "./models/ResizeContext.js";

export class InputController {
    private isMouseDown = false;
    private isResizing = false;
    private resizeType: 'col' | 'row' | null = null;
    private resizeIndex = -1;
    private resizeStartSize = 0;
    private resizeStartPos = 0;
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

        // const hit = this.app.resizeManager.getResizeHit(
        //     x, y,
        //     this.app.scrollManager.scrollX, this.app.scrollManager.scrollY,
        //     this.app.colOffsets,
        //     this.app.rowOffsets
        // );

        // if (hit) {
        //     this.isResizing = true;
        //     this.resizeType = hit.type;
        //     this.resizeIndex = hit.index;
        //     this.resizeStartPos = hit.type === 'col' ? e.clientX : e.clientY;
        //     this.resizeStartSize = hit.type === 'col'
        //         ? this.app.grid.colWidths[hit.index]!
        //         : this.app.grid.rowHeights[hit.index]!;
        //     return;
        // }

        const coords = screenToGridCoords(e.clientX, e.clientY, canvas, this.app.colOffsets, this.app.rowOffsets, this.app.scrollManager);

        if (!coords) return;

        for (const handler of this.handlers) {
            if (handler.hitTest(x, y)) {
                this.activeHandler = handler;
                this.activeHandler.handleMouseDown(e);
                break;
            }
        }
        this.isMouseDown = true;
        this.app.draw();
    }

    private handleMouseMove(e: MouseEvent, canvas: HTMLCanvasElement) {
    //     const { x, y } = getCanvasCoords(e, canvas);

        // if (this.isMouseDown) {
            // for (const handler of this.handlers) {
            //     handler.handleMouseMove(e);
            // }
        // }

        this.activeHandler?.handleMouseMove(e);

        //     if (this.isResizing) {
        //         if (this.resizeType === 'col') {
        //             const deltaX = e.clientX - this.resizeStartPos;
        //             this.app.resizeManager.resizeColumn(
        //                 this.resizeIndex,
        //                 deltaX,
        //                 this.resizeStartSize,
        //                 this.app.grid.colWidths,
        //                 this.app.colOffsets
        //             );
        //         } else if (this.resizeType === 'row') {
        //             const deltaY = e.clientY - this.resizeStartPos;
        //             this.app.resizeManager.resizeRow(
        //                 this.resizeIndex,
        //                 deltaY,
        //                 this.resizeStartSize,
        //                 this.app.grid.rowHeights,
        //                 this.app.rowOffsets
        //             );
        //         }
        //         this.app.draw();
        //         return;
        //     }


        //     const hit = this.app.resizeManager.getResizeHit(
        //         x,
        //         y,
        // this.app.scrollManager.scrollX,
        //         this.app.scrollManager.scrollY,
        //         this.app.colOffsets,
        //         this.app.rowOffsets
        //     );
        // if (hit) {
        //     canvas.style.cursor = hit.type === 'col' ? 'col-resize' : 'row-resize';
        // } else {
        //     canvas.style.cursor = 'default';
        // }
        this.app.draw();
    }

    private handleMouseUp(e: MouseEvent, canvas: HTMLCanvasElement): void {
        // for(const handler of this.handlers) {
        //     this.activeHandler = handler;
        //     this.activeHandler.handleMouseUp();
        // }
        // if (this.isResizing) {
        //     this.app.commitResizeHistory(this.resizeType!, this.resizeIndex, this.resizeStartSize);
        // }
        // this.isMouseDown = false;
        // this.isResizing = false;
        // this.resizeType = null;
        // this.resizeIndex = -1;
        this.activeHandler?.handleMouseUp();
        this.app.draw();
    }

    private handleDoubleClick(e: MouseEvent, canvas: HTMLCanvasElement) {
        const activeCell: null | Point = this.app.selectionManager.getActiveCell();
        if (activeCell) this.app.startEditingAtCell(activeCell);
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
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

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
            this.app.selectionManager.startSelection(activeCell.col, activeCell.row);
            this.app.draw();
        }
    }
}