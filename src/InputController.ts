import { Spreadsheet } from "./CanvasSperadSheet.js";
import { GridConfig } from "./config/GridConfig.js";
import { Point } from "./models/Point.js";
import { SelectionRange } from "./models/SelectionRange";

export class InputController {
    private isMouseDown = false;
    private isResizing = false;
    private resizeType: 'col' | 'row' | null = null;
    private resizeIndex = -1;
    private resizeStartSize = 0;
    private resizeStartPos = 0;

    constructor(private app: Spreadsheet) { }

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

    private getCanvasCoords(e: MouseEvent, canvas: HTMLCanvasElement): { x: number, y: number } {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return { x, y };
    }

    private handleMouseDown(e: MouseEvent, canvas: HTMLCanvasElement): void {
        if (e.button !== 0) return;

        const { x, y } = this.getCanvasCoords(e, canvas);

        const hit = this.app.resizeManager.getResizeHit(
            x, y,
            this.app.scrollManager.scrollX, this.app.scrollManager.scrollY,
            this.app.colOffsets,
            this.app.rowOffsets
        );

        if (hit) {
            this.isResizing = true;
            this.resizeType = hit.type;
            this.resizeIndex = hit.index;
            this.resizeStartPos = hit.type === 'col' ? e.clientX : e.clientY;
            this.resizeStartSize = hit.type === 'col'
                ? this.app.grid.colWidths[hit.index]!
                : this.app.grid.rowHeights[hit.index]!;
            return;
        }

        if (y < this.app.grid.headerHeight && x > this.app.grid.headerWidth) {
            const virtualX = x - this.app.grid.headerWidth + this.app.scrollManager.scrollX;
            const clickedCol = this.app.colOffsets.lowerBound(virtualX);

            if (clickedCol >= 0 && clickedCol < GridConfig.MAX_COLS) {
                this.app.selectionManager.selectEntireColumn(clickedCol);
                this.isMouseDown = true;
                this.app.draw();
            }
            return;
        }

        if (x < this.app.grid.headerWidth && y > this.app.grid.headerHeight) {
            const virtualY = y - this.app.grid.headerHeight + this.app.scrollManager.scrollY;
            const clickedRow = this.app.rowOffsets.lowerBound(virtualY);

            if (clickedRow >= 0 && clickedRow < GridConfig.MAX_ROWS) {
                this.app.selectionManager.selectEntireRow(clickedRow);
                this.isMouseDown = true;
                this.app.draw();
            }
            return;
        }


        if (x <= this.app.grid.headerWidth && y <= this.app.grid.headerHeight) {
            return;
        }

        this.isMouseDown = true;
        const coords = this.app.screenToGridCoords(e.clientX, e.clientY);
        if (coords) {
            this.app.selectionManager.startSelection(coords.col, coords.row);
            this.app.draw();
        }
    }

    private handleMouseMove(e: MouseEvent, canvas: HTMLCanvasElement) {
        const { x, y } = this.getCanvasCoords(e, canvas);

        if (this.isResizing) {
            if (this.resizeType === 'col') {
                const deltaX = e.clientX - this.resizeStartPos;
                this.app.resizeManager.resizeColumn(
                    this.resizeIndex,
                    deltaX,
                    this.resizeStartSize,
                    this.app.grid.colWidths,
                    this.app.colOffsets
                );
            } else if (this.resizeType === 'row') {
                const deltaY = e.clientY - this.resizeStartPos;
                this.app.resizeManager.resizeRow(
                    this.resizeIndex,
                    deltaY,
                    this.resizeStartSize,
                    this.app.grid.rowHeights,
                    this.app.rowOffsets
                );
            }
            this.app.draw();
            return;
        }


        const hit = this.app.resizeManager.getResizeHit(
            x,
            y,
            this.app.scrollManager.scrollX,
            this.app.scrollManager.scrollY,
            this.app.colOffsets,
            this.app.rowOffsets
        );
        if (hit) {
            canvas.style.cursor = hit.type === 'col' ? 'col-resize' : 'row-resize';
        } else {
            canvas.style.cursor = 'default';
        }


        if (this.isMouseDown) {
            const coords = this.app.screenToGridCoords(e.clientX, e.clientY);
            if (coords) {
                this.app.selectionManager.updateSelection(coords.col, coords.row);
                this.app.draw();
            }
        }
    }

    private handleMouseUp(e: MouseEvent, canvas: HTMLCanvasElement): void {
        if (this.isResizing) {
            this.app.commitResizeHistory(this.resizeType!, this.resizeIndex, this.resizeStartSize);
        }

        this.isMouseDown = false;
        this.isResizing = false;
        this.resizeType = null;
        this.resizeIndex = -1;
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

        if(!activeCell) return;

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