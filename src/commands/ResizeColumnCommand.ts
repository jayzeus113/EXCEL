import type Command from "./Command.ts";
import type { ResizeManager } from "../managers/ResizeManager.js";
import type FenwickTree from "../DataStructures/FenwickTree.ts";
 
export class ResizeColumnCommand implements Command {
  constructor(
    private resizeManager: ResizeManager,
    private columnIndex: number,
    private newWidth: number,
    private oldWidth: number,
    private colWidths: number[],
    private colOffsets: FenwickTree
  ) {}
 
  public execute(): void {
    const deltaX = this.newWidth - this.oldWidth;
    
    this.resizeManager.resizeColumn(
      this.columnIndex,
      deltaX,
      this.oldWidth,
      this.colWidths,
      this.colOffsets
    );
  }
 
  public undo(): void {
    const deltaX = this.oldWidth - this.newWidth;
    
    this.resizeManager.resizeColumn(
      this.columnIndex,
      deltaX,
      this.newWidth,
      this.colWidths,
      this.colOffsets
    );
  }
}
