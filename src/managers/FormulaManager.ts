import { CellManager } from "./CellManager";

export class FormulaManager {
  private readonly cellManager: CellManager;

  constructor(cellManager: CellManager) {
    this.cellManager = cellManager;
  }

  public evaluateFormula(formula: string, visited: Set<string>): string {
    if (!formula.length || formula[0] !== '=') return formula;

    const expression = formula.substring(1);
    let hasCircularDependency = false;

    const evaluatedExpression = expression.replace(/[A-Z]+[0-9]+/g, (ref) => {
      const val = this.getCellValue(ref, visited);
      if (val === "#CIRCULAR") {
        hasCircularDependency = true;
      }
      return val.toString();
    });

    if (hasCircularDependency) {
      return "#CIRCULAR";
    }

    try {
      const result = new Function(`return (${evaluatedExpression})`)();
      return result !== undefined && !isNaN(result) ? result.toString() : "#ERROR";
    } catch {
      return "#ERROR";
    }
  }

  private parseCellAddress(addr: string) {
    const match = addr.match(/^([A-Z]+)(\d+)$/);
    if (!match) throw new Error("Invalid address format");
    
    const colName: string = match[1]!;
    const row = Number(match[2]) - 1;
    
    let col = 0;
    for (const ch of colName) {
      col = col * 26 + (ch.charCodeAt(0) - 64);
    }
    col--;
    
    return { row, col };
  }

  private getCellValue(address: string, visited: Set<string>): number | string {
    if (visited.has(address)) {
      return "#CIRCULAR";
    }
    
    visited.add(address);

    const { row, col } = this.parseCellAddress(address);
    const cell = this.cellManager.getCell(col, row);

    if (!cell || !cell.value) {
      visited.delete(address);
      return 0;
    }

    let value: string | number;
    if (cell.value.startsWith('=')) {
      const evalResult = this.evaluateFormula(cell.value, visited);
      value = evalResult === "#CIRCULAR" || evalResult === "#ERROR" ? evalResult : Number(evalResult);
    } else {
      value = Number(cell.value);
      if (isNaN(value)) value = 0;
    }

    visited.delete(address);
    return value;
  }

  public checkForFormula(formula: string): string {
    const visited: Set<string> = new Set<string>();
    return this.evaluateFormula(formula, visited);
  }
}
