import { GridConfig } from "../config/GridConfig.js";
import type { GridModel } from "../models/GridModel.ts";
import type { SelectionRange } from "../models/SelectionRange.ts";

export class SelectionRenderer{
 
    constructor(private ctx:CanvasRenderingContext2D){}
 
    public draw(grid:GridModel){
 
        for(const selection of grid.selections){
            this.drawSelection(selection,grid);
        }
    }
 
    private drawSelection(
        selection:SelectionRange,
        grid:GridModel
    ){
        const startX=grid.getCellX(selection.start.col);
        const startY=grid.getCellY(selection.start.row);

        const endX=grid.getCellX(selection.end.col);
        const endY=grid.getCellY(selection.end.row);

        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
 
        const w=grid.getRangeWidth(selection);
        const h=grid.getRangeHeight(selection);
 
        this.ctx.save();
 
        this.ctx.strokeStyle=GridConfig.SELECT_STROKE_COLOR;
        this.ctx.lineWidth=2;
        
        this.ctx.strokeRect(
            x+0.5,
            y+0.5,
            w-1,
            h-1
        );


 
        this.ctx.restore();
    }
}