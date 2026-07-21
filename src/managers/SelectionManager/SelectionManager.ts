import type { SelectionRange } from "../../models/SelectionRange.ts";
import { SelectionType } from "../../models/SelectionType.js";
import type { Point } from "../../mod../../models/Point.js";
import { GridConfig } from "../../config/GridConfig.js";

export default class SelectionManager {
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

    public getActiveCell(): null | Point {
        if(this.selections.length) return this.selections[0].activeCell;
        return null;
    }

    public selectEntireColumn(colIndex: number): void {
        const range: SelectionRange = {
            start: { col: colIndex, row: 0 },
            end: { col: colIndex, row: GridConfig.MAX_ROWS - 1 },
            type: SelectionType.Column,
            activeCell: { col: colIndex, row: 0 }
        };

        
        this.selections = [range];
        this.activeRange = range;
    }
    // public selectEntireRow(rowIndex: number): void {
    //     const range: SelectionRange = {
    //         start: { col: 0, row: rowIndex },
    //         end: { col: GridConfig.MAX_COLS - 1, row: rowIndex },
    //         type: SelectionType.Row,
    //         activeCell: { col: 0, row: rowIndex }
    //     };

    //     this.selections = [range];
    //     this.activeRange = range;
    // }

}