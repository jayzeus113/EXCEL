// import type { GridModel } from "../models/GridModel.ts";
// import type { SelectionRange } from "../models/SelectionRange.ts";

// export class SelectionRenderer{
 
    // constructor(private ctx:CanvasRenderingContext2D){}
 
    // public draw(grid:GridModel){
 
        // for(const selection of grid.selections){
 
        //     this.drawSelection(selection,grid);
        // }
    // }
 
    // private drawSelection(
    //     selection:SelectionRange,
    //     grid:GridModel
    // ){
    //      const x=grid.getCellX(selection.start.col);
    //     const y=grid.getCellY(selection.start.row);
 
    //     const w=grid.getRangeWidth(selection);
    //     const h=grid.getRangeHeight(selection);
 
    //     this.ctx.save();
 
    //     this.ctx.strokeStyle="#107c41";
    //     this.ctx.lineWidth=2;
 
    //     this.ctx.strokeRect(
    //         x+0.5,
    //         y+0.5,
    //         w-1,
    //         h-1
    //     );
 
    //     this.ctx.restore();
    // }
// }