import type Command from "./Command.ts";
import ColumnResizeManager from "../managers/ResizeManager/ColumnResizeManager.js";
import FenwickTree from "../DataStructures/FenwickTree.js";

export class ResizeColumnCommand implements Command {
  constructor(
    private columnIndex: number,
    private newWidth: number,
    private oldWidth: number,
    private colWidths: number[],
    private colOffsets: FenwickTree
  ) { }

  public execute(): void {
    const deltaX = this.oldWidth - this.newWidth;
    const newColWidth = Math.max(30, this.oldWidth + deltaX);
    const currentWidth = this.colWidths[this.columnIndex] ?? 0;
    const change: number = newColWidth - currentWidth;

    this.colOffsets.add(this.columnIndex + 1, change);
    this.colWidths[this.columnIndex] = newColWidth;
  }

  public undo(): void {
    const deltaX = this.newWidth - this.oldWidth;
    const newColWidth = Math.max(30, this.newWidth + deltaX);
    const currentWidth = this.colWidths[this.columnIndex] ?? 0;
    const change: number = newColWidth - currentWidth;

    this.colOffsets.add(this.columnIndex + 1, change);
    this.colWidths[this.columnIndex] = newColWidth;
  }
}


