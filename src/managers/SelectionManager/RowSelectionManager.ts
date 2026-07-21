import { GridConfig } from "../../config/GridConfig.js";
import { SelectionRange } from "../../models/SelectionRange.js";
import { SelectionType } from "../../models/SelectionType.js";
import SelectionManager from "./SelectionManager.js";

export default class RowSelectionManager {
    private selectionManager:SelectionManager;

    constructor(selectionManager:SelectionManager) {
        this.selectionManager = selectionManager;
    }
    public hitTest(x: number, y: number): boolean {
        return y < GridConfig.HEADER_WIDTH && x > GridConfig.HEADER_HEIGHT;
    }

    public handle(ColIndex:number, RowIndex:number) {
        if (RowIndex >= 0 && RowIndex < GridConfig.MAX_ROWS) {
            const range: SelectionRange = {
                start: { col: 0, row: RowIndex },
                end: { col: GridConfig.MAX_COLS - 1, row: RowIndex },
                type: SelectionType.Row,
                activeCell: { col: 0, row: RowIndex }
            };
            this.selectionManager.setSelection(range);
        }
        return;
    }
}