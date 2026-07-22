export function getCanvasCoords(e: MouseEvent, canvas: HTMLCanvasElement): { x: number, y: number } {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
}
