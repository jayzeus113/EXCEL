import type { CellData } from "../models/CellData.ts";

export class CellManager {
 
    private cells = new Map<string, CellData>();
 
    public getCell(row: number, col: number): CellData | undefined {
        const key = `${row},${col}`
        return this.cells.get(key);
    }
 
    public setCell(row: number, col: number, value: CellData): void {
        const key = `${row},${col}`;
        this.cells.set(key, value);
    }
 
    public clearCell(row: number, col: number): void {
        const key = `${row},${col}`;
        this.cells.delete(key);
    }
}