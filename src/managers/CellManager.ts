import type { CellData } from "../models/CellData.ts";

export class CellManager {
 
    private cells = new Map<string, CellData>();
 
    public getCell(col: number, row: number): CellData | undefined {
        const key = `${col},${row}`
        return this.cells.get(key);
    }
 
    public setCell(col: number, row: number, value: CellData): void {
        const key = `${col},${row}`;
        this.cells.set(key, value);
    }
 
    public clearCell(col: number, row: number): void {
        const key = `${col},${row}`;
        this.cells.delete(key);
    }

    public clear(): void {
        this.cells.clear();
    }
}