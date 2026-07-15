import { CellManager } from "../managers/CellManager.js";

export abstract class DataLoader {
    public abstract load(
        cellManager: CellManager
    ):void;
}
