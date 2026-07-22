import { GridConfig } from "../../config/GridConfig.js";
import { screenToGridCoords } from "../../helpers/screenToGridCoords.js";
import SelectionManager from "./SelectionManager.js";

export default class SubGridSelectionManager {
    private selectionManager;

    constructor(selectionManager: SelectionManager) {
        this.selectionManager = selectionManager;
    }
    public hitTest(x: number, y: number): boolean {
        return y > GridConfig.HEADER_HEIGHT && x > GridConfig.HEADER_WIDTH;
    }

    public handleMouseDown(e: MouseEvent) {
        const coords = screenToGridCoords(e.clientX, e.clientY, this.selectionManager.canvas, this.selectionManager.colOffsets, this.selectionManager.rowOffsets, this.selectionManager.scrollManager);
        if (!coords) return;
        this.selectionManager.isMouseDown = true;

        if (coords.col >= 0 && coords.col < GridConfig.MAX_COLS && coords.row >= 0 && coords.row < GridConfig.MAX_ROWS) {
            this.selectionManager.startSelection(coords.col, coords.row);
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