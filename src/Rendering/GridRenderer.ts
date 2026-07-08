import type { GridModel } from "../models/GridModel.ts";
import type { CellRenderer } from "./CellRenderer.ts";
import type { HeaderRenderer } from "./HeaderRenderer.ts";
// import type { SelectionRenderer } from "./SelectionRenderer.ts";
import type { ScrollManager } from "../managers/ScrollManager.ts";
import FenwickTree from '../DataStructures/FenwickTree.js';

export class GridRenderer {
    constructor(
        private cellRenderer: CellRenderer,
        private headerRenderer: HeaderRenderer,
        // private selectionRenderer: SelectionRenderer
    ) {}
 
    public render(
        grid: GridModel, 
        scrollManager: ScrollManager,
        colOffsets: FenwickTree,
        rowOffsets: FenwickTree
    ): void {
        const ctx = grid.ctx;

        // 1. Fetch virtual bounds from ScrollManager to draw only what's visible
        const { startCol, endCol } = scrollManager.getVisibleCols(colOffsets);
        const { startRow, endRow } = scrollManager.getVisibleRows(rowOffsets);

        // Clamp boundaries tightly against our maximum operational model grid sizes
        const renderStartCol = Math.max(grid.startCol, startCol);
        const renderEndCol = Math.min(grid.endCol, endCol + 1); // +1 buffer prevents visual clipping edge gaps
        const renderStartRow = Math.max(grid.startRow, startRow);
        const renderEndRow = Math.min(grid.endRow, endRow + 1);

        // 2. Render background grid cells with view clipping boundaries
        ctx.save();
        
        ctx.beginPath();
        ctx.rect(
            grid.headerWidth, 
            grid.headerHeight, 
            ctx.canvas.width - grid.headerWidth, 
            ctx.canvas.height - grid.headerHeight
        );
        ctx.clip();

        // Translate the context transformation matrix to shift data layout smoothly
        ctx.translate(-scrollManager.scrollX, -scrollManager.scrollY);

        // Render visible grid data blocks
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

        // Render selections inside the data canvas area
        // this.selectionRenderer.draw(grid);
        
        ctx.restore(); // Restore context back to clean un-translated grid layout baseline states

        // 3. Render only the visible fixed headers on top of background layers
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
