import { ResizeRowCommand } from "../../commands/ResizeRowCommand.js";
import { GridConfig } from "../../config/GridConfig.js";
import { screenToGridCoords } from "../../helpers/screenToGridCoords.js";
import { ResizeContext } from "../../models/ResizeContext.js";
import { resizeState } from "../../models/resizeState.js";
import { HistoryManager } from "../HistoryManager.js";
import { ScrollManager } from "../ScrollManager.js";


export default class RowResizeManager {
    private resizingStartPos: number;
    private historyManager: HistoryManager;
    private scrollManager: ScrollManager;

    private resizeState: resizeState | null = null;

    constructor(private context: ResizeContext, historyManager: HistoryManager, scrollManager: ScrollManager) {
        this.historyManager = historyManager;
        this.resizingStartPos = 0;
        this.scrollManager = scrollManager;
    }

    public hitTest(x: number, y: number): boolean {
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
        if (!coords) return;

        this.resizingStartPos = e.clientY;
        this.resizeState = { index: coords.row, startPos: e.clientY, oldSize: this.context.heights[coords.row] };
        this.context.canvas.style.cursor = 'row-resize';
    }

    public handleMouseMove(e: MouseEvent): void {
        const coords = screenToGridCoords(e.clientX, e.clientY, this.context.canvas, this.context.colOffsets, this.context.rowOffsets, this.scrollManager);
        if (this.resizeState && coords) {
            const deltaY = e.clientY - this.resizingStartPos;
            const newRowHeight: number = Math.max(15, this.context.heights[coords.row] + deltaY);
            const currentHeight = this.context.heights[coords.row] ?? 0;
            const change: number = newRowHeight - currentHeight;

            this.context.rowOffsets.add(coords.row + 1, change);
            this.context.heights[coords.row] = newRowHeight;
        }
    }

    public handleMouseUp(): void {
        if (this.resizeState) {
            this.context.canvas.style.cursor = 'default';
            console.log(this.resizeState);
            const finalWidth = this.context.widths[this.resizeState.index]!;
            if (finalWidth !== this.resizeState.oldSize) {
                const command = new ResizeRowCommand(this.resizeState.index, finalWidth, this.resizeState.oldSize, this.context.heights, this.context.rowOffsets);
                this.historyManager.executeCommand(command);
            }
        }
        this.resizeState = null;
    }
}