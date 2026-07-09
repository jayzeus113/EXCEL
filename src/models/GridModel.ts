import { GridConfig } from "../config/GridConfig.js";
import type { CellData } from "./CellData.ts";
import type { CellState } from "./CellState.ts";
import type { SelectionRange } from "./SelectionRange.ts";

export interface GridModel{
 
    ctx:CanvasRenderingContext2D;
 
    startRow:number;
    endRow:number;
 
    startCol:number;
    endCol:number;
 
    rowHeights:number[];
    colWidths:number[];
 
    headerWidth:number;
    headerHeight:number;
 
    selections:SelectionRange[];

 
    getCell(c:number,r:number):CellData|undefined;
 
    getCellState(c:number,r:number):CellState;
 
    getCellX(c:number):number;
 
    getCellY(r:number):number;
 
    getColumnLabel(c:number):string;
    
    getRangeWidth(range:SelectionRange):number;
 
    getRangeHeight(range:SelectionRange):number;

}