import type { SelectionRange } from "../models/SelectionRange.ts";
import { SelectionType } from "../models/SelectionType.js";
import type { Point } from "../models/Point.ts";

export class SelectionManager {
    private selections: SelectionRange[] = [];
    
    private activeRange: SelectionRange | null = null;

    public getSelections(): SelectionRange[] {
        return this.selections;
    }

    public clear(): void {
        this.selections = [];
        this.activeRange = null;
    }

    public setSelection(selection: SelectionRange): void {
        this.selections = [selection];
        this.activeRange = selection;
    }

    public addSelection(selection: SelectionRange): void {
        this.selections.push(selection);
        this.activeRange = selection;
    }

    /**
     * Spawns a clean single-cell selection anchor point on MouseDown
     */
    public startSelection(col: number, row: number, type: SelectionType = SelectionType.Cell): void {
        const anchor: Point = { col: col, row: row };
        // console.log(anchor);
        this.activeRange = {
            start: anchor,
            end: anchor,
            type: type,
            activeCell: anchor
        };

        // Standard spreadsheets overwrite past highlights unless holding a modifier key (like Ctrl)
        this.selections = [this.activeRange];
    }

    /**
     * Drags and stretches the boundary of the current selection on MouseMove
     */
    public updateSelection(col: number, row: number): void {
        if (!this.activeRange) return;

        // Stretch the end position boundary to the cell currently under the cursor
        this.activeRange.end = { col: col, row: row };
    }

    /**
     * Evaluates if a specific row and column fall inside any active selection box
     * Maps: Point.x -> Column, Point.y -> Row
     */
    public isSelected(col: number, row: number): boolean {
        return this.selections.some(s => {
            const minCol = Math.min(s.start.col, s.end.col);
            const maxCol = Math.max(s.start.col, s.end.col);
            const minRow = Math.min(s.start.row, s.end.row);
            const maxRow = Math.max(s.start.row, s.end.row);

            return col >= minCol && col <= maxCol && row >= minRow && row <= maxRow;
        });
    }
}
