import { GridConfig } from "../../config/GridConfig.js";
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

    public handle(colIndex: number, rowIndex: number) {
        if (colIndex >= 0 && colIndex < GridConfig.MAX_COLS) {
            const range: SelectionRange = {
                start: { col: colIndex, row: 0 },
                end: { col: colIndex, row: GridConfig.MAX_ROWS - 1 },
                type: SelectionType.Column,
                activeCell: { col: colIndex, row: 0 }
            };
            this.selectionManager.setSelection(range);
        }
        return;
    }
}