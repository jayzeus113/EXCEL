import type { GridModel } from "../models/GridModel.js";
import type { CellRenderer } from "./CellRenderer.js";
import type { HeaderRenderer } from "./HeaderRenderer.js";
import type { SelectionRenderer } from "./SelectionRenderer.js";
import type { ScrollManager } from "../managers/ScrollManager.js";
import FenwickTree from '../DataStructures/FenwickTree.js';

export class GridRenderer {
    constructor(
        private cellRenderer: CellRenderer,
        private headerRenderer: HeaderRenderer,
        private selectionRenderer: SelectionRenderer
    ) {}
 
    public render(
        grid: GridModel, 
        scrollManager: ScrollManager,
        colOffsets: FenwickTree,
        rowOffsets: FenwickTree
    ): void {
        const ctx = grid.ctx;

        const { startCol, endCol } = scrollManager.getVisibleCols(colOffsets);
        const { startRow, endRow } = scrollManager.getVisibleRows(rowOffsets);

        const renderStartCol = Math.max(grid.startCol, startCol);
        const renderEndCol = Math.min(grid.endCol, endCol + 1);
        const renderStartRow = Math.max(grid.startRow, startRow);
        const renderEndRow = Math.min(grid.endRow, endRow + 1);

        
        ctx.save();
        
        ctx.beginPath();
        ctx.rect(
            grid.headerWidth, 
            grid.headerHeight, 
            ctx.canvas.width - grid.headerWidth, 
            ctx.canvas.height - grid.headerHeight
        );
        ctx.clip();

        ctx.translate(-scrollManager.scrollX, -scrollManager.scrollY);

        
        for (let r = renderStartRow; r < renderEndRow; r++) {
            for (let c = renderStartCol; c < renderEndCol; c++) {
                const x = grid.getCellX(c);
                const y = grid.getCellY(r);
 
                this.cellRenderer.draw(
                    x,
                    y,
                    grid.colWidths[c] as number,
                    grid.rowHeights[r] as number,
                    grid.getCell(c, r),
                    grid.getCellState(c, r)
                );
            }
        }

        this.selectionRenderer.draw(grid);
        ctx.restore(); 
        
        this.headerRenderer.draw(
            grid, 
            scrollManager.scrollX, 
            scrollManager.scrollY,
            renderStartCol,
            renderEndCol,
            renderStartRow,
            renderEndRow
        );
    }
}
