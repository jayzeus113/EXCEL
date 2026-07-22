import ColumnResizeManager from "./managers/ResizeManager/ColumnResizeManager";
import RowResizeManager from "./managers/ResizeManager/RowResizeManager";
import ColumnSelectionManager from "./managers/SelectionManager/ColumnSelectionManager";
import RowSelectionManager from "./managers/SelectionManager/RowSelectionManager";
import SubGridSelectionManager from "./managers/SelectionManager/SubGridSelectionManager";

export type ActiveHandler = ColumnSelectionManager | RowSelectionManager | SubGridSelectionManager | ColumnResizeManager | RowResizeManager | null;