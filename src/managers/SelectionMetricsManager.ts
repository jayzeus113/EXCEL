import { SelectionMetrics } from "../models/SelectionMetrics";
import { CellManager } from "./CellManager";
import { SelectionManager } from "./SelectionManager";

export class SelectionMetricsManager {
    private readonly selectionManager: SelectionManager;
    private readonly cellManager: CellManager;

    constructor(selectionManager:SelectionManager, cellManager:CellManager) {
        this.selectionManager = selectionManager;
        this.cellManager = cellManager;
    }
    public computeSelectionMetrics(): SelectionMetrics | null {
        const selections = this.selectionManager.getSelections();
        if (!selections || selections.length === 0) return null;

        let count = 0;
        let sum = 0;
        let min = Infinity;
        let max = -Infinity;

        const processedCells = new Set<string>();

        for (const range of selections) {
            const minCol = Math.min(range.start.col, range.end.col);
            const maxCol = Math.max(range.start.col, range.end.col);
            const minRow = Math.min(range.start.row, range.end.row);
            const maxRow = Math.max(range.start.row, range.end.row);

            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    const cellKey = `${r},${c}`;

                    if (processedCells.has(cellKey)) continue;
                    processedCells.add(cellKey);

                    const cellData = this.cellManager.getCell(c, r);
                    if (!cellData || !cellData.value) continue;

                    const trimmedValue = cellData.value.trim();
                    if (trimmedValue === "") continue;

                    const numericValue = Number(trimmedValue);

                    if (!isNaN(numericValue)) {
                        count++;
                        sum += numericValue;
                        if (numericValue < min) min = numericValue;
                        if (numericValue > max) max = numericValue;
                    }
                }
            }
        }
        if (count === 0) return null;

        return {
            count: count,
            min: min,
            max: max,
            sum: sum,
            average: sum / count
        };
    }
}