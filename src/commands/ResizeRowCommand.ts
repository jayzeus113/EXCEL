import type Command from "./Command.ts";
import RowResizeManager from "../managers/ResizeManager/RowResizeManager.js";
import FenwickTree from "../DataStructures/FenwickTree.js";

export class ResizeRowCommand implements Command {
  constructor(
    private rowIndex: number,
    private newHeight: number,
    private oldHeight: number,
    private rowHeights: number[],
    private rowOffsets: FenwickTree

  ) { }

  execute() {
    // const deltaY = this.newHeight - this.oldHeight;
    // const newRowHeight: number = Math.max(15, this.oldHeight + deltaY);
    // const currentHeight = this.rowHeights[this.rowIndex] ?? 0;
    // const change: number = newRowHeight - currentHeight;

    // this.rowOffsets.add(this.rowIndex + 1, change);
    // this.rowHeights[this.rowIndex] = newRowHeight;

    const targetedHeight = Math.max(15, this.newHeight); 
    const currentHeight = this.rowHeights[this.rowIndex] ?? 0; 
    const change = targetedHeight - currentHeight; 

    this.rowOffsets.add(this.rowIndex + 1, change); 
    this.rowHeights[this.rowIndex] = targetedHeight; 
  }

  undo() {
    // const deltaY = this.oldHeight - this.newHeight;
    // const newRowHeight: number = Math.max(15, this.oldHeight + deltaY);
    // const currentHeight = this.rowHeights[this.rowIndex] ?? 0;
    // const change: number = newRowHeight - currentHeight;

    // this.rowOffsets.add(this.rowIndex + 1, change);
    // this.rowHeights[this.rowIndex] = newRowHeight;
    const currentHeight = this.rowHeights[this.rowIndex] ?? 0; 
    const change = this.oldHeight - currentHeight; 

    this.rowOffsets.add(this.rowIndex + 1, change); 
    this.rowHeights[this.rowIndex] = this.oldHeight; 
  }
}
