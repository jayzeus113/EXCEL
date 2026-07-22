import { GridConfig } from "../config/GridConfig.js";
import FenwickTree from "../DataStructures/FenwickTree.js";
import { ScrollManager } from "../managers/ScrollManager.js";
import { Point } from "../models/Point.js";

export function screenToGridCoords(screenX: number, screenY: number, canvas:HTMLCanvasElement, colOffsets: FenwickTree, rowOffsets: FenwickTree, scrollManager: ScrollManager): Point | null {
    const rect = canvas.getBoundingClientRect();
    const x = screenX - rect.left - GridConfig.HEADER_WIDTH + scrollManager.scrollX;
    const y = screenY - rect.top - GridConfig.HEADER_HEIGHT + scrollManager.scrollY;

    let row = -1, col = -1;

    if (screenX - rect.left < GridConfig.HEADER_WIDTH) col = -1;
    else col = colOffsets.lowerBound(x);
    if (screenY - rect.top < GridConfig.HEADER_HEIGHT) row = -1;
    else row = rowOffsets.lowerBound(y);

    if (col >= GridConfig.MAX_COLS || row >= GridConfig.MAX_ROWS) {
        return null;
    }

    return { col: col, row: row };
}
