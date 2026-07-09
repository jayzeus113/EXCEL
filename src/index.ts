
import { Spreadsheet } from "./CanvasSperadSheet.js";




window.addEventListener('DOMContentLoaded', () => {
    // console.log("HI");
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const editor = document.getElementById('cell-editor') as HTMLInputElement;
    const statusBar = document.getElementById("spreadsheetStatusBar") as HTMLDivElement;
    const spreadsheet = new Spreadsheet(canvas, editor, statusBar);

});