import { ResizeRowCommand } from "../../commands/ResizeRowCommand.js";
import { GridConfig } from "../../config/GridConfig.js";
import { screenToGridCoords } from "../../helpers/screenToGridCoords.js";
import { ResizeContext } from "../../models/ResizeContext.js";
import { resizeState } from "../../models/resizeState.js";
import { HistoryManager } from "../HistoryManager.js";
import { ScrollManager } from "../ScrollManager.js";


export default class RowResizeManager {
    private historyManager: HistoryManager;
    private scrollManager: ScrollManager;
    private resizeState: resizeState | null = null;

    constructor(private context: ResizeContext, historyManager: HistoryManager, scrollManager: ScrollManager) {
        this.historyManager = historyManager;
        this.scrollManager = scrollManager;
    }

    public hitTest(x: number, y: number): boolean {
        const scrollY = this.scrollManager.scrollY;

        if (x >= 0 && x <= GridConfig.HEADER_WIDTH && y > GridConfig.HEADER_HEIGHT) {
            const virtualY = y - GridConfig.HEADER_HEIGHT + scrollY;
            const rowIndex = this.context.rowOffsets.lowerBound(virtualY);

            if (rowIndex !== -1) {
                const edgeY = (this.context.rowOffsets.prefixSum(rowIndex + 1) as number) - scrollY + GridConfig.HEADER_HEIGHT;
                return Math.abs(y - edgeY) <= GridConfig.RESIZE_THRESHOLD;
            }
        }
        return false;
    }

    public handleMouseDown(e: MouseEvent): void {
        const coords = screenToGridCoords(e.clientX, e.clientY, this.context.canvas, this.context.colOffsets, this.context.rowOffsets, this.scrollManager);
        if (!coords || coords.row == -1) return;

        this.context.canvas.style.cursor = 'row-resize';

        const initialSize = this.context.heights[coords.row] ?? 0
        this.resizeState = { index: coords.row, startPos: e.clientY, oldSize: initialSize };
    }

    public handleMouseMove(e: MouseEvent): void {
        if (!this.resizeState) return;

        const deltaY = e.clientY - this.resizeState.startPos;
        const newRowHeight: number = Math.max(15, this.resizeState.oldSize + deltaY);
        const currentHeight = this.context.heights[this.resizeState.index] ?? 0;
        const change: number = newRowHeight - currentHeight;

        this.context.rowOffsets.add(this.resizeState.index + 1, change);
        this.context.heights[this.resizeState.index] = newRowHeight;
    }

    public handleMouseUp(): void {
        if (!this.resizeState) return;
        this.context.canvas.style.cursor = 'default';

        const finalHeight = this.context.heights[this.resizeState.index] ?? 0;

        if (finalHeight !== this.resizeState.oldSize) {
            const currentHeight = finalHeight;
            const revertChange = this.resizeState.oldSize - currentHeight;
            this.context.rowOffsets.add(this.resizeState.index + 1, revertChange);
            this.context.heights[this.resizeState.index] = this.resizeState.oldSize;

            const command = new ResizeRowCommand(this.resizeState.index, finalHeight, this.resizeState.oldSize, this.context.heights, this.context.rowOffsets);
            this.historyManager.executeCommand(command);
        }
        this.resizeState = null;
    }
}