import FenwickTree from "../DataStructures/FenwickTree.js";
import { GridModel } from "../models/GridModel.js";

export class ScrollManager {
  private _scrollX = 0;
  private _scrollY = 0;

  // Viewport dimensions (updated when canvas resizes)
  private viewportWidth = 0;
  private viewportHeight = 0;

  // Total grid boundary sizes in pixels
  private maxScrollWidth = 0;
  private maxScrollHeight = 0;

  constructor() { }

  // Getters to expose read-only offsets to the Spreadsheet and Renderers
  public get scrollX(): number { return this._scrollX; }
  public get scrollY(): number { return this._scrollY; }

  /**
   * Updates bounding metrics needed to clamp scroll limits accurately
   */
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

    // Total size of grid minus the size of the window viewport
    const totalGridWidth = colOffsets.prefixSum(maxCols);
    const totalGridHeight = rowOffsets.prefixSum(maxRows);

    this.maxScrollWidth = Math.max(0, totalGridWidth - this.viewportWidth);
    this.maxScrollHeight = Math.max(0, totalGridHeight - this.viewportHeight);
  }

  /**
   * Handles relative wheel trackpad updates, clamping values within boundaries
   */
  public scroll(dx: number, dy: number): void {
    this._scrollX = Math.max(0, Math.min(this._scrollX + dx, this.maxScrollWidth));
    this._scrollY = Math.max(0, Math.min(this._scrollY + dy, this.maxScrollHeight));
  }

  /**
   * Returns the starting and ending row indices visible on screen
   */
  public getVisibleRows(rowOffsets: FenwickTree): { startRow: number; endRow: number } {
    // Find first row where prefix pixel height matches or exceeds scroll positioning
    const startRow = rowOffsets.lowerBound(this._scrollY);

    // Find last row matching the bottom margin threshold of the viewport
    const endRow = rowOffsets.lowerBound(this._scrollY + this.viewportHeight);

    return { startRow, endRow };
  }

  /**
   * Returns the starting and ending column indices visible on screen
   */
  public getVisibleCols(colOffsets: FenwickTree): { startCol: number; endCol: number } {
    // Find first column matching current left-side scroll view matrix
    const startCol = colOffsets.lowerBound(this._scrollX);

    // Find last column matching the right-side layout threshold of the viewport
    const endCol = colOffsets.lowerBound(this._scrollX + this.viewportWidth);

    return { startCol, endCol };
  }
  public setScroll(targetX: number, targetY: number, grid: GridModel): void {
    // 1. Calculate total structural dimensions from your offsets
    // If you use FenwickTree, the total is usually tree.getTotal() or accumulated widths
    const totalGridWidth = grid.colWidths.reduce((sum:number, w:number) => sum + w, 0);
    const totalGridHeight = grid.rowHeights.reduce((sum:number, h:number) => sum + h, 0);

    // 2. Compute the maximum allowable viewport offsets
    // We add header metrics because headers take up structural canvas screen space
    const maxScrollX = Math.max(0, totalGridWidth - (grid.ctx.canvas.width - grid.headerWidth));
    const maxScrollY = Math.max(0, totalGridHeight - (grid.ctx.canvas.height - grid.headerHeight));

    // 3. Clamp values strictly within boundaries [0, maxScroll]
    this._scrollX = Math.max(0, Math.min(targetX, maxScrollX));
    this._scrollY = Math.max(0, Math.min(targetY, maxScrollY));
  }
}
