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

    public addSelection(col: number, row: number, type: SelectionType = SelectionType.Cell): void {
        const anchor: Point = { col: col, row: row };
        this.activeRange = {
            start: anchor,
            end: anchor,
            type: type,
            activeCell: anchor
        }

        this.selections.push(this.activeRange);
    }

    public startSelection(col: number, row: number, type: SelectionType = SelectionType.Cell): void {
        const anchor: Point = { col: col, row: row };
        this.activeRange = {
            start: anchor,
            end: anchor,
            type: type,
            activeCell: anchor
        };

        this.selections = [this.activeRange];
    }


    public updateSelection(col: number, row: number): void {
        if (!this.activeRange) return;
        this.activeRange.end = { col: col, row: row };
    }

    public isSelected(col: number, row: number): boolean {
        return this.selections.some(s => {
            const minCol = Math.min(s.start.col, s.end.col);
            const maxCol = Math.max(s.start.col, s.end.col);
            const minRow = Math.min(s.start.row, s.end.row);
            const maxRow = Math.max(s.start.row, s.end.row);

            return col >= minCol && col <= maxCol && row >= minRow && row <= maxRow;
        });
    }

    public isActive(col: number, row: number): boolean {
        if (!this.activeRange) return false;
        return this.activeRange.start.col == col && this.activeRange.start.row == row;
    }
}
