// import { GridConfig } from "../../config/GridConfig.js";
// import FenwickTree from "../../DataStructures/FenwickTree.js";
// import type { ResizeHit } from "../../models/ResizeHit.js";
// import { ScrollManager } from "../ScrollManager.js";

// export class ResizeManager {

//     public readonly scrollManager: ScrollManager;
//     public readonly colOffsets:FenwickTree;
//     public readonly rowOffsets:FenwickTree;
//     public readonly colWidths:number[];
//     public readonly rowHeights:number[];


//     constructor(scrollManager: ScrollManager, colOffsets:FenwickTree, rowOffsets:FenwickTree, colWidths:number[], rowHeights:number[]) {
//         this.scrollManager = scrollManager;
//         this.colOffsets = colOffsets;
//         this.rowOffsets = rowOffsets;
//         this.colWidths = colWidths;
//         this.rowHeights = rowHeights;
//     }

    // public getResizeHit(
    //     x: number,
    //     y: number,
    // ): ResizeHit | null {

        // if (y >= 0 && y <= GridConfig.HEADER_HEIGHT && x > GridConfig.HEADER_WIDTH) {
        //     const virtualX = x - GridConfig.HEADER_WIDTH + scrollX;
        //     const colIndex = colOffsets.lowerBound(virtualX);
            
        //     if (colIndex !== -1) {
        //         const edgeX = (colOffsets.prefixSum(colIndex + 1) as number) - scrollX + GridConfig.HEADER_WIDTH;
        //         if (Math.abs(x - edgeX) <= GridConfig.RESIZE_THRESHOLD) {
        //             return { type: 'col', index: colIndex };
        //         }
        //     }
        // }
        
        // if (x >= 0 && x <= GridConfig.HEADER_WIDTH && y > GridConfig.HEADER_HEIGHT) {
        //     const virtualY = y - GridConfig.HEADER_HEIGHT + scrollY;
        //     const rowIndex = rowOffsets.lowerBound(virtualY);

        //     if (rowIndex !== -1) {
        //         const edgeY = (rowOffsets.prefixSum(rowIndex + 1) as number) - scrollY + GridConfig.HEADER_HEIGHT;
        //         if (Math.abs(y - edgeY) <= GridConfig.RESIZE_THRESHOLD) {
        //             return { type: 'row', index: rowIndex };
        //         }
        //     }
        // }
        
        // return null;
    // }

    // public resizeColumn(
    //     colIndex: number,
    //     deltaX: number,
    //     startSize: number,
    //     colWidths: number[],
    //     colOffsets: FenwickTree
    // ): void {
        // const newColWidth = Math.max(30, startSize + deltaX);
        // const currentWidth = colWidths[colIndex] ?? 0;
        // const change: number = newColWidth - currentWidth;
        
        // colOffsets.add(colIndex + 1, change);
        // colWidths[colIndex] = newColWidth;
    // }

    // public resizeRow(
    //     rowIndex: number,
    //     deltaY: number,
    //     startSize: number,
    //     rowHeights: number[],
    //     rowOffsets: FenwickTree
    // ): void {
    //     const newRowHeight: number = Math.max(15, startSize + deltaY);
    //     const currentHeight = rowHeights[rowIndex] ?? 0;
    //     const change: number = newRowHeight - currentHeight;
        
    //     rowOffsets.add(rowIndex + 1, change);
    //     rowHeights[rowIndex] = newRowHeight;
    // }
// }
// 