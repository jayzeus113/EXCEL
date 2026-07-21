import { GridConfig } from "../../config/GridConfig.js";
import { SelectionRange } from "../../models/SelectionRange.js";
import { SelectionType } from "../../models/SelectionType.js";
import SelectionManager from "./SelectionManager.js";

export default class SubGridSelectionManager {
    private selectionManager;

    constructor(selectionManager: SelectionManager) {
        this.selectionManager = selectionManager;
    }
    public hitTest(x: number, y: number): boolean {
        return y > GridConfig.HEADER_HEIGHT && x > GridConfig.HEADER_WIDTH;
    }

    public handle(colIndex:number, rowIndex:number) {
        if (colIndex >= 0 && colIndex < GridConfig.MAX_COLS && rowIndex >= 0 && rowIndex < GridConfig.MAX_ROWS) {
            this.selectionManager.startSelection(colIndex, rowIndex);
        }
        return;
    }
}