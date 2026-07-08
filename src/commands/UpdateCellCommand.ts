import type { CellData } from "../models/CellData.ts";
import type Command from "./Command.ts";
 
class UpdateCellCommand implements Command {
  constructor(
    private cellData: Map<string, CellData>,
    private cellKey: string,
    private newValue: CellData,
    private oldValue: undefined|CellData = cellData.get(cellKey)
  ) {}
 
  execute(): void {
    this.cellData.set(this.cellKey, this.newValue);
  }
 
  undo(): void {
    if(this.oldValue === undefined) {
      this.cellData.delete(this.cellKey);
    } else {
      this.cellData.set(this.cellKey, this.oldValue);
    }
  }
}