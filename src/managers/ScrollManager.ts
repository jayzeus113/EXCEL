import FenwickTree from "../DataStructures/FenwickTree.js";
import { GridModel } from "../models/GridModel.js";

export class ScrollManager {
  private _scrollX = 0;
  private _scrollY = 0;

  private viewportWidth = 0;
  private viewportHeight = 0;

  private maxScrollWidth = 0;
  private maxScrollHeight = 0;

  constructor() { }

  public get scrollX(): number { return this._scrollX; }
  public get scrollY(): number { return this._scrollY; }
  public updateMetrics(
    viewportWidth: number,
    viewportHeight: number,
    colOffsets: FenwickTree,
    rowOffsets: FenwickTree,
    maxCols: number,
    maxRows: number,
    headerWidth: number,
    headerHeight: number
  ): void {
    this.viewportWidth = viewportWidth - headerWidth;
    this.viewportHeight = viewportHeight - headerHeight;

    const totalGridWidth = colOffsets.prefixSum(maxCols);
    const totalGridHeight = rowOffsets.prefixSum(maxRows);

    this.maxScrollWidth = Math.max(0, totalGridWidth - this.viewportWidth);
    this.maxScrollHeight = Math.max(0, totalGridHeight - this.viewportHeight);
  }

  public scroll(dx: number, dy: number): void {
    this._scrollX = Math.max(0, Math.min(this._scrollX + dx, this.maxScrollWidth));
    this._scrollY = Math.max(0, Math.min(this._scrollY + dy, this.maxScrollHeight));
  }

  public getVisibleRows(rowOffsets: FenwickTree): { startRow: number; endRow: number } {
    const startRow = rowOffsets.lowerBound(this._scrollY);

    const endRow = rowOffsets.lowerBound(this._scrollY + this.viewportHeight);

    return { startRow, endRow };
  }

  public getVisibleCols(colOffsets: FenwickTree): { startCol: number; endCol: number } {
    const startCol = colOffsets.lowerBound(this._scrollX);

    const endCol = colOffsets.lowerBound(this._scrollX + this.viewportWidth);

    return { startCol, endCol };
  }
  public setScroll(targetX: number, targetY: number, grid: GridModel): void {
    const maxScrollX = this.maxScrollWidth;
    const maxScrollY = this.maxScrollHeight;

    this._scrollX = Math.max(0, Math.min(targetX, maxScrollX));
    this._scrollY = Math.max(0, Math.min(targetY, maxScrollY));
  }

  public scrollToCell(
    row: number,
    col: number,
    colOffsets: FenwickTree,
    rowOffsets: FenwickTree,
    grid: GridModel
  ): void {
    const cellLeft = colOffsets.prefixSum(col) as number;
    const cellTop = rowOffsets.prefixSum(row) as number;

    const cellWidth = grid.colWidths[col] ?? 0;
    const cellHeight = grid.rowHeights[row] ?? 0;

    const cellRight = cellLeft + cellWidth;
    const cellBottom = cellTop + cellHeight;

    let targetX = this._scrollX;
    let targetY = this._scrollY;

    if (cellLeft < this._scrollX) {
      targetX = cellLeft;
    } else if (cellRight > this._scrollX + this.viewportWidth) {
      targetX = cellRight - this.viewportWidth;
    }

    if (cellTop < this._scrollY) {
      targetY = cellTop;
    } else if (cellBottom > this._scrollY + this.viewportHeight) {
      targetY = cellBottom - this.viewportHeight;
    }

    this.setScroll(targetX, targetY, grid);
  }
}
