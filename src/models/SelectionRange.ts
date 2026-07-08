import type { Point } from "./Point.ts";
import { SelectionType } from "./SelectionType.js"; 
 
export interface SelectionRange {
 
    start: Point;
 
    end: Point;
 
    type: SelectionType;
 
    activeCell: Point;
}