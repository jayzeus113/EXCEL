import { GridConfig } from "../../config/GridConfig.js";
import { screenToGridCoords } from "../../helpers/screenToGridCoords.js";
import { SelectionRange } from "../../models/SelectionRange.js";
import { SelectionType } from "../../models/SelectionType.js";
import SelectionManager from "./SelectionManager.js";

export default class RowSelectionManager {
    private selectionManager:SelectionManager;

    constructor(selectionManager:SelectionManager) {
        this.selectionManager = selectionManager;
    }
    public hitTest(x: number, y: number): boolean {
        return x < GridConfig.HEADER_WIDTH && y > GridConfig.HEADER_HEIGHT;
    }

    public handleMouseDown(e: MouseEvent) {
        const coords = screenToGridCoords(e.clientX, e.clientY, this.selectionManager.canvas, this.selectionManager.colOffsets, this.selectionManager.rowOffsets, this.selectionManager.scrollManager);
        if(!coords) return;
        this.selectionManager.isMouseDown = true;

        if (coords.row >= 0 && coords.row < GridConfig.MAX_ROWS) {
            const range: SelectionRange = {
                start: { col: 0, row: coords.row },
                end: { col: GridConfig.MAX_COLS - 1, row: coords.row },
                type: SelectionType.Row,
                activeCell: { col: 0, row: coords.row }
            };
            this.selectionManager.setSelection(range);
        }
        return;
    }

    public handleMouseMove(e:MouseEvent) {
        const coords = screenToGridCoords(e.clientX, e.clientY, this.selectionManager.canvas, this.selectionManager.colOffsets, this.selectionManager.rowOffsets, this.selectionManager.scrollManager);
        if (coords && this.selectionManager.isMouseDown) {
            this.selectionManager.updateSelection(coords.col, coords.row);
        }
    }

    public handleMouseUp() {
        this.selectionManager.isMouseDown = false;
    }
}