import type Command from "./Command.ts";
import type FenwickTree from "../DataStructures/FenwickTree.ts";
 
class ResizeColumnCommand implements Command {
  constructor(
    private widthsArray: number[],
    private fenwickTree: FenwickTree,
    private columnIndex: number,
    private newWidth: number,
    private oldWidth: number
  ) {}
 
  execute() {
    const delta = this.newWidth - this.oldWidth;
    this.widthsArray[this.columnIndex] = this.newWidth;
    this.fenwickTree.add(this.columnIndex, delta);
  }
 
  undo() {
    const delta = this.oldWidth - this.newWidth;
    this.widthsArray[this.columnIndex] = this.oldWidth;
    this.fenwickTree.add(this.columnIndex, delta);
  }
}
 