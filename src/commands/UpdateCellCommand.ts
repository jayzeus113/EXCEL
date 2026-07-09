import { CellManager } from "../managers/CellManager.js";
import type { CellData } from "../models/CellData.ts";
import type Command from "./Command.ts";
 
export class UpdateCellCommand implements Command {
  constructor(
    private cellManager: CellManager,
    private row: number,
    private col: number,
    private newCellData: CellData,
    private oldCellData: undefined|CellData
  ) {}
 
  execute(): void {
    this.cellManager.setCell(this.row, this.col, this.newCellData);
  }
 
  undo(): void {
    if(this.oldCellData === undefined) {
      this.cellManager.clearCell(this.row, this.col);
    } else {
      this.cellManager.setCell(this.row, this.col, this.oldCellData);
    }
  }
}