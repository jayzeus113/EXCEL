import { ResizeColumnCommand } from "../../commands/ResizeColumnCommand.js";
import { GridConfig } from "../../config/GridConfig.js";
import { screenToGridCoords } from "../../helpers/screenToGridCoords.js";
import { ResizeContext } from "../../models/ResizeContext.js";
import { resizeState } from "../../models/resizeState.js";
import { HistoryManager } from "../HistoryManager.js";
import { ScrollManager } from "../ScrollManager.js";

export default class ColumnResizeManager {
    private readonly context: ResizeContext;
    private historyManager: HistoryManager;
    private resizeState: resizeState | null = null;
    private resizingStartPos:number = 0;
    private scrollManager: ScrollManager;

    constructor(context: ResizeContext, historyManager: HistoryManager, scrollManager: ScrollManager) {
        this.context = context;
        this.scrollManager = scrollManager;
        this.historyManager = historyManager;
    }

    public hitTest(x: number, y: number): boolean {
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
        if (!coords) return;
        this.context.canvas.style.cursor = 'col-resize';
        this.resizingStartPos = e.clientX;
        this.resizeState = { index: coords.row, startPos: e.clientY, oldSize: this.context.heights[coords.row] };
    }

    public handleMouseMove(e: MouseEvent): void {
        const coords = screenToGridCoords(e.clientX, e.clientY, this.context.canvas, this.context.colOffsets, this.context.rowOffsets, this.scrollManager);
        if (this.resizeState && coords) {
            const deltaX = e.clientX - this.resizingStartPos;
            const newColWidth = Math.max(30, this.context.widths[coords.col] + deltaX);
            const currentWidth = this.context.widths[coords.col] ?? 0;
            const change: number = newColWidth - currentWidth;

            this.context.colOffsets.add(coords.col + 1, change);
            this.context.widths[coords.col] = newColWidth;
        }

    }

    public handleMouseUp(): void {
        if (this.resizeState) {
            this.context.canvas.style.cursor = 'default';
            const finalWidth = this.context.widths[this.resizeState.index]!;
            if (finalWidth !== this.resizeState.oldSize) {
                const command = new ResizeColumnCommand(this.resizeState.index, finalWidth, this.resizeState.oldSize, this.context.widths, this.context.colOffsets);
                this.historyManager.executeCommand(command);
            }
        }
        this.resizeState = null;
    }
}