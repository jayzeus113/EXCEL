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
    const targetedWidth = Math.max(30, this.newWidth);
    const currentWidth = this.colWidths[this.columnIndex] ?? 0;
    const change = targetedWidth - currentWidth;

    this.colOffsets.add(this.columnIndex + 1, change);
    this.colWidths[this.columnIndex] = targetedWidth;
  }

  public undo(): void {
    const currentWidth = this.colWidths[this.columnIndex] ?? 0;
    const change: number = this.oldWidth - currentWidth;

    this.colOffsets.add(this.columnIndex + 1, change);
    this.colWidths[this.columnIndex] = this.oldWidth;
  }
}


