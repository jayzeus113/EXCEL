import ColumnSelectionManager from "./managers/SelectionManager/ColumnSelectionManager";
import RowSelectionManager from "./managers/SelectionManager/RowSelectionManager";
import SubGridSelectionManager from "./managers/SelectionManager/SubGridSelectionManager";

export type ActiveHandler = ColumnSelectionManager | RowSelectionManager | SubGridSelectionManager | null;