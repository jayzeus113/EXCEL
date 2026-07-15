// src/services/JSONDataLoader.ts
import { DataLoader } from "./DataLoader.js";
import type { CellManager } from "../managers/CellManager.js";
import type { FormulaManager } from "../managers/FormulaManager.js";
import data from '../../dataset.json' with {type : 'json'};
import { Employee } from "../models/Employee.js";

export class JSONDataLoader extends DataLoader {
    constructor(private formulaManager: FormulaManager) {
        super();
    }

    public load(cellManager: CellManager) : void {
        cellManager.clear();

        const jsonData = data as Employee[];
 
        if (!jsonData || jsonData.length === 0) return;
 
        const headers = Object.keys(jsonData[0]) as (keyof Employee)[];
 
        headers.forEach((header, colIndex) => {
            cellManager.setCell(colIndex, 0, {value:String(header)});
        });
 
        jsonData.forEach((record, rowIndex) => {
            const actualRow = rowIndex + 1;
            headers.forEach((key, colIndex) => {
                const cellValue = String(record[key] ?? '');
                cellManager.setCell(colIndex, actualRow, {value:cellValue});
            });
        });
    }
}
