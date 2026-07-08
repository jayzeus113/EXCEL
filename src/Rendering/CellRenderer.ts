import type { CellData } from "../models/CellData.ts";
import type { CellState } from "../models/CellState.ts";

export class CellRenderer {
    constructor(private readonly ctx: CanvasRenderingContext2D) { }

    public draw(
        x: number,
        y: number,
        width: number,
        height: number,
        cell: CellData | undefined,
        state: CellState
    ): void {


        this.drawBackground(x, y, width, height, state);
        this.drawBorder(x, y, width, height);
        this.drawText(x, y, width, height, cell);

        if (state.active) {
            this.drawActiveBorder(x, y, width, height);
        }
    }

    private drawBackground(
        x: number,
        y: number,
        width: number,
        height: number,
        state: CellState
    ): void {

        if (state.selected) {
            this.ctx.fillStyle = "#e8f5e9";
        } else {
            this.ctx.fillStyle = "#ffffff";
        }

        this.ctx.fillRect(x, y, width, height);
    }

    private drawBorder(
        x: number,
        y: number,
        width: number,
        height: number
    ): void {

        this.ctx.strokeStyle = "#e0e0e0";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    }

    private drawText(
        x: number,
        y: number,
        width: number,
        height: number,
        cell?: CellData
    ): void {

        if (!cell || cell.value === "") {
            return;
        }

        this.ctx.save();

        this.ctx.beginPath();
        this.ctx.rect(x + 4, y, width - 8, height);
        this.ctx.clip();

        this.ctx.fillStyle = "#000";
        this.ctx.font = "12px Arial";
        this.ctx.textBaseline = "middle";
        this.ctx.textAlign = "left";

        this.ctx.fillText(cell.value, x + 6, y + height / 2);

        this.ctx.restore();
    }

    private drawActiveBorder(
        x: number,
        y: number,
        width: number,
        height: number
    ): void {
        console.log("JI00");
        this.ctx.save();

        this.ctx.strokeStyle = "#7c1010";
        this.ctx.lineWidth = 2;
        
        
        this.ctx.strokeRect(
            x + 0.5,
            y + 0.5,
            width - 1,
            height - 1
        );

        this.ctx.restore();
    }
}
