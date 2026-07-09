import type { CellData } from './models/CellData.js';
import type { CellState } from './models/CellState.js';
import type { SelectionRange } from './models/SelectionRange.js';
import type { GridModel } from './models/GridModel.js';
import type { CellManager } from './managers/CellManager.js';
import type { SelectionManager } from './managers/SelectionManager.js';

export class CanvasGrid implements GridModel {
    ctx: CanvasRenderingContext2D;
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
    rowHeights: number[];
    colWidths: number[];
    headerWidth: number;
    headerHeight: number;

    
    private cellManager: CellManager;
    private selectionManager: SelectionManager;

    constructor(
        ctx: CanvasRenderingContext2D,
        cellManager: CellManager,
        selectionManager: SelectionManager,
        config: {
            startRow?: number;
            endRow?: number;
            startCol?: number;
            endCol?: number;
            rowHeights?: number[];
            colWidths?: number[];
            headerWidth?: number;
            headerHeight?: number;
        } = {}
    ) {
        this.ctx = ctx;
        this.cellManager = cellManager;
        this.selectionManager = selectionManager;

        this.startRow = config.startRow ?? 0;
        this.endRow = config.endRow ?? 100;
        this.startCol = config.startCol ?? 0;
        this.endCol = config.endCol ?? 26;

        this.rowHeights = config.rowHeights ?? Array(this.endRow).fill(24);
        this.colWidths = config.colWidths ?? Array(this.endCol).fill(80);

        this.headerWidth = config.headerWidth ?? 50;
        this.headerHeight = config.headerHeight ?? 25;
    }

    
    public get selections(): SelectionRange[] {
        return this.selectionManager.getSelections() as SelectionRange[];
    }

    public set selections(val: SelectionRange[]) {
        // Controlled by core event loop handlers through SelectionManager
    }

    // Query active cell matrix allocations directly out of your manager instance
    getCell(c: number, r: number): CellData | undefined {
        return this.cellManager.getCell(c, r);
    }

    getCellState(c: number, r: number): CellState {
        return {
            selected: this.selectionManager.isSelected(c, r),
            active: this.selectionManager.isActive(c, r)
        } as unknown as CellState;
    }

    // Calculate pixel X coordinate relative to grid origin
    getCellX(c: number): number {
        let x = this.headerWidth;
        const limit = Math.min(c, this.colWidths.length);
        for (let i = 0; i < limit; i++) {
            x += this.colWidths[i] as number;
        }
        return x;
    }

    // Calculate pixel Y coordinate relative to grid origin
    getCellY(r: number): number {
        let y = this.headerHeight;
        const limit = Math.min(r, this.rowHeights.length);
        for (let i = 0; i < limit; i++) {
            y += this.rowHeights[i] as number;
        }
        return y;
    }

    getColumnLabel(c: number): string {
        let label = '';
        let temp = c;
        while (temp >= 0) {
            label = String.fromCharCode((temp % 26) + 65) + label;
            temp = Math.floor(temp / 26) - 1;
        }
        return label;
    }

    getRangeWidth(range: SelectionRange): number {
        let width = 0;
        const start = Math.min(range.start.col, range.end.col);
        const end = Math.max(range.start.col, range.end.col);
        for (let i = start; i <= end; i++) {
            width += this.colWidths[i] ?? 0;
        }
        return width;
    }

    getRangeHeight(range: SelectionRange): number {
        let height = 0;
        const start = Math.min(range.start.row, range.end.row);
        const end = Math.max(range.start.row, range.end.row);
        for (let i = start; i <= end; i++) {
            height += this.rowHeights[i] ?? 0;
        }
        return height;
    }

    isCellSelected(c: number, r: number): boolean {
        return this.selectionManager.isSelected(c, r);
    }
}