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
        // Uniform text configuration to prevent cross-contamination
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        // Draw components sequentially in isolated context transformations using virtual bounds
        this.drawColumnHeaders(grid, scrollX, startCol, endCol);
        this.drawRowHeaders(grid, scrollY, startRow, endRow);
        this.drawCorner(grid);
    }
 
    private drawColumnHeaders(grid: GridModel, scrollX: number, startCol: number, endCol: number) {
        this.ctx.save();
 
        // Clip horizontal viewport bounds (keeps text out of the corner box)
        this.ctx.beginPath();
        this.ctx.rect(
            grid.headerWidth, 
            0, 
            this.ctx.canvas.width - grid.headerWidth, 
            grid.headerHeight
        );
        this.ctx.clip();

        // Translate ONLY horizontally for column layout calculations
        this.ctx.translate(-scrollX, 0);

        // Optimized loop: only checks visible elements
        for (let c = startCol; c < endCol; c++) {
            const x = grid.getCellX(c);
            const w = grid.colWidths[c]!;
 
            // Fill background blocks
            this.ctx.fillStyle = "#f3f3f3";
            this.ctx.fillRect(x, 0, w, grid.headerHeight);
 
            // Draw clean vertical boundaries (Column Dividers)
            this.ctx.strokeStyle = "#cccccc";
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, 0, w, grid.headerHeight);

            // Render labels
            this.ctx.fillStyle = "#000000";
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
 
        // Clip vertical viewport bounds (keeps text out of the corner box)
        this.ctx.beginPath();
        this.ctx.rect(
            0, 
            grid.headerHeight, 
            grid.headerWidth, 
            this.ctx.canvas.height - grid.headerHeight
        );
        this.ctx.clip();

        // Translate ONLY vertically for row layout calculations
        this.ctx.translate(0, -scrollY);

        // Optimized loop: only checks visible elements
        for (let r = startRow; r < endRow; r++) {
            const y = grid.getCellY(r);
            const h = grid.rowHeights[r]!;

            // Fill background blocks
            this.ctx.fillStyle = "#f3f3f3";
            this.ctx.fillRect(0, y, grid.headerWidth, h);
 
            // Draw clean horizontal boundaries (Row Dividers)
            this.ctx.strokeStyle = "#cccccc";
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(0, y, grid.headerWidth, h);

            // Render numeric indexes
            this.ctx.fillStyle = "#000000";
            this.ctx.fillText(
                (r + 1).toString(),
                grid.headerWidth / 2,
                y + h / 2
            );
        }

        this.ctx.restore();
    }
 
    private drawCorner(grid: GridModel) {
        // Locks firmly at absolute point 0,0 without translations
        this.ctx.fillStyle = "#e6e6e6";
        this.ctx.fillRect(0, 0, grid.headerWidth, grid.headerHeight);
 
        this.ctx.strokeStyle = "#b5b5b5";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, grid.headerWidth, grid.headerHeight);
    }
}
