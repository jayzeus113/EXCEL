import FenwickTree from "../DataStructures/FenwickTree";
import { ScrollManager } from "../managers/ScrollManager";

export interface ResizeContext {
    // scrollManager: ScrollManager;
    rowOffsets: FenwickTree;
    colOffsets: FenwickTree;
    heights: number[];
    widths: number[];
    canvas: HTMLCanvasElement;
}