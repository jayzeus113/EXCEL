import { GridConfig } from "../../config/GridConfig.js";
import { screenToGridCoords } from "../../helpers/screenToGridCoords.js";
import { SelectionRange } from "../../models/SelectionRange.js";
import { SelectionType } from "../../models/SelectionType.js";
import SelectionManager from "./SelectionManager.js";

export default class ColumnSelectionManager {
    private selectionManager: SelectionManager;

    constructor(selectionManager: SelectionManager) {
        this.selectionManager = selectionManager;
    }
    public hitTest(x: number, y: number): boolean {
        return y < GridConfig.HEADER_HEIGHT && x > GridConfig.HEADER_WIDTH;
    }

    public handleMouseDown(e: MouseEvent) {
        const coords = screenToGridCoords(e.clientX, e.clientY, this.selectionManager.canvas, this.selectionManager.colOffsets, this.selectionManager.rowOffsets, this.selectionManager.scrollManager);
        if (!coords) return;
        this.selectionManager.isMouseDown = true;

        if (coords.col >= 0 && coords.col < GridConfig.MAX_COLS) {
            const range: SelectionRange = {
                start: { col: coords.col, row: 0 },
                end: { col: coords.col, row: GridConfig.MAX_ROWS - 1 },
                type: SelectionType.Column,
                activeCell: { col: coords.col, row: 0 }
            };
            this.selectionManager.setSelection(range);
        }
        return;
    }

    public handleMouseMove(e: MouseEvent) {
        const coords = screenToGridCoords(e.clientX, e.clientY, this.selectionManager.canvas, this.selectionManager.colOffsets, this.selectionManager.rowOffsets, this.selectionManager.scrollManager);
        if (coords && this.selectionManager.isMouseDown) {
            this.selectionManager.updateSelection(coords.col, coords.row);
        }
    }

    public handleMouseUp() {
        this.selectionManager.isMouseDown = false;
    }
}