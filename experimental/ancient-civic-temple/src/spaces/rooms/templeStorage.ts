/** Rear storage room and direct threshold */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { thresholdCells } from "../../geometry/thresholdCells";
import { levelCell } from "../../geometry/levelCell";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeLevels as y } from "../templeLevels";
import { templeStoragePlan } from "./templeStoragePlan";
export const templeStorage = (): IAutoMovieBuiltSpace => ({
  id: "storage", kind: "storage", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("storage.body", templeStoragePlan, y.floor, y.lowCeiling),
    ...thresholdCells("storage", templeDoorPassages, y.floor),
  ],
});

