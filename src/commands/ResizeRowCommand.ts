import type Command from "./Command.ts";
import type FenwickTree from "../DataStructures/FenwickTree.ts";
import { ResizeManager } from "../managers/ResizeManager.js";
 
export class ResizeRowCommand implements Command {
  constructor(
    private resizeManager: ResizeManager,
    private rowIndex: number,
    private newHeight: number,
    private oldHeight: number,
    private rowHeights: number[],
    private rowOffsets: FenwickTree,
  ) {}
 
  execute() {
    const deltaY = this.newHeight - this.oldHeight;
    this.resizeManager.resizeRow(
        this.rowIndex,
        deltaY,
        this.oldHeight,
        this.rowHeights,
        this.rowOffsets
    );
  }
 
  undo() {
    const deltaY = this.oldHeight - this.newHeight;
    
    this.resizeManager.resizeColumn(
      this.rowIndex,
      deltaY,
      this.newHeight,
      this.rowHeights,
      this.rowOffsets
    );
  }
}
 