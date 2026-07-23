import { ResizeColumnCommand } from "../../commands/ResizeColumnCommand.js";
import { GridConfig } from "../../config/GridConfig.js";
import { screenToGridCoords } from "../../helpers/screenToGridCoords.js";
import { ResizeContext } from "../../models/ResizeContext.js";
import { resizeState } from "../../models/resizeState.js";
import { HistoryManager } from "../HistoryManager.js";
import { ScrollManager } from "../ScrollManager.js";

export default class ColumnResizeManager {
    private historyManager: HistoryManager;
    private resizeState: resizeState | null = null;
    private scrollManager: ScrollManager;

    constructor(private context: ResizeContext, historyManager: HistoryManager, scrollManager: ScrollManager) {
        this.scrollManager = scrollManager;
        this.historyManager = historyManager;
    }

    public hitTest(x: number, y: number): boolean {
        const scrollX = this.scrollManager.scrollX;

        if (y >= 0 && y <= GridConfig.HEADER_HEIGHT && x > GridConfig.HEADER_WIDTH) {
            const virtualX = x - GridConfig.HEADER_WIDTH + scrollX;
            const colIndex = this.context.colOffsets.lowerBound(virtualX);

            if (colIndex !== -1) {
                const edgeX = (this.context.colOffsets.prefixSum(colIndex + 1) as number) - scrollX + GridConfig.HEADER_WIDTH;
                return Math.abs(x - edgeX) <= GridConfig.RESIZE_THRESHOLD;
            }
        }
        return false;
    }

    public handleMouseDown(e: MouseEvent): void {
        const coords = screenToGridCoords(e.clientX, e.clientY, this.context.canvas, this.context.colOffsets, this.context.rowOffsets, this.scrollManager);
        if (!coords || coords.col == -1) return;
        this.context.canvas.style.cursor = 'col-resize';
        const initialSize = this.context.widths[coords.col] ?? 0;
        this.resizeState = { index: coords.col, startPos: e.clientX, oldSize: initialSize };
    }
    
    public handleMouseMove(e: MouseEvent): void {
        if(!this.resizeState) return;

        const deltaX = e.clientX - this.resizeState.startPos;
        const newColWidth = Math.max(30, this.resizeState.oldSize + deltaX);
        const currentWidth = this.context.widths[this.resizeState.index] ?? 0;
        const change: number = newColWidth - currentWidth;

        this.context.colOffsets.add(this.resizeState.index + 1, change);
        this.context.widths[this.resizeState.index] = newColWidth;
    }

    public handleMouseUp(): void {
        if(!this.resizeState) return;
        this.context.canvas.style.cursor = 'default';

        const finalWidth = this.context.widths[this.resizeState.index] ?? 0;

        if (finalWidth !== this.resizeState.oldSize) {
            const currentWidth = finalWidth;
            const revertChange = this.resizeState.oldSize - currentWidth;
            this.context.colOffsets.add(this.resizeState.index+1, revertChange);
            this.context.widths[this.resizeState.index] = this.resizeState.oldSize;

            const command = new ResizeColumnCommand(this.resizeState.index, finalWidth, this.resizeState.oldSize, this.context.widths, this.context.colOffsets);
            this.historyManager.executeCommand(command);
        }
        this.resizeState = null;
    }
}