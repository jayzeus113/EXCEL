import { GridConfig } from "../config/GridConfig.js";
import type { GridModel } from "../models/GridModel.ts";

export class HeaderRenderer {
 
    constructor(private ctx: CanvasRenderingContext2D){}
 
    public draw(
        grid: GridModel, 
        scrollX: number, 
        scrollY: number,
        startCol: number,
        endCol: number,
        startRow: number,
        endRow: number
    ): void {
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        this.drawColumnHeaders(grid, scrollX, startCol, endCol);
        this.drawRowHeaders(grid, scrollY, startRow, endRow);
        this.drawCorner(grid);
    }
 
    private drawColumnHeaders(grid: GridModel, scrollX: number, startCol: number, endCol: number) {
        this.ctx.save();
 
        this.ctx.beginPath();
        this.ctx.rect(
            grid.headerWidth, 
            0, 
            this.ctx.canvas.width - grid.headerWidth, 
            grid.headerHeight
        );
        this.ctx.clip();

        this.ctx.translate(-scrollX, 0);

        for (let c = startCol; c < endCol; c++) {
            const x = grid.getCellX(c);
            const w = grid.colWidths[c]!;

            const isColumnSelected = grid.selections.some(range => {
                const minCol = Math.min(range.start.col, range.end.col);
                const maxCol = Math.max(range.start.col, range.end.col);
                return c >= minCol && c <= maxCol;
            });

 
            this.ctx.fillStyle = isColumnSelected ? GridConfig.SELECT_HEADER_BACKGROUND_COLOR : GridConfig.HEADER_BG;

            this.ctx.fillRect(x, 0, w, grid.headerHeight);
 
            this.ctx.strokeStyle = GridConfig.HEADER_STROKE_STYLE;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, 0, w, grid.headerHeight);

            this.ctx.fillStyle = GridConfig.HEADER_TEXT;
            this.ctx.fillText(
                grid.getColumnLabel(c),
                x + w / 2,
                grid.headerHeight / 2
            );
        }

        this.ctx.restore();
    }
 
    private drawRowHeaders(grid: GridModel, scrollY: number, startRow: number, endRow: number) {
        this.ctx.save();
 
        
        this.ctx.beginPath();
        this.ctx.rect(
            0, 
            grid.headerHeight, 
            grid.headerWidth, 
            this.ctx.canvas.height - grid.headerHeight
        );
        this.ctx.clip();

        
        this.ctx.translate(0, -scrollY);

        
        for (let r = startRow; r < endRow; r++) {
            const y = grid.getCellY(r);
            const h = grid.rowHeights[r]!;

            const isRowSelected = grid.selections.some(range => {
                const minRow = Math.min(range.start.row, range.end.row);
                const maxRow = Math.max(range.start.row, range.end.row);
                return r >= minRow && r <= maxRow;
            });

 
            this.ctx.fillStyle = isRowSelected ? GridConfig.SELECT_HEADER_BACKGROUND_COLOR : GridConfig.HEADER_BG;
            
            this.ctx.fillRect(0, y, grid.headerWidth, h);
 
            this.ctx.strokeStyle = GridConfig.HEADER_STROKE_STYLE;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(0, y, grid.headerWidth, h);

            this.ctx.fillStyle = GridConfig.HEADER_TEXT;
            this.ctx.fillText(
                (r + 1).toString(),
                grid.headerWidth / 2,
                y + h / 2
            );
        }

        this.ctx.restore();
    }
 
    private drawCorner(grid: GridModel) {
        this.ctx.fillStyle = GridConfig.CORNER_BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, grid.headerWidth, grid.headerHeight);
 
        this.ctx.strokeStyle = GridConfig.CORNER_STROKE_STYLE;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, grid.headerWidth, grid.headerHeight);
    }
}
