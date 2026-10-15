import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { thresholdCells } from "../../geometry/thresholdCells";
import { levelCell } from "../../geometry/levelCell";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeLevels as y } from "../templeLevels";
import { templeAdministrationPlan } from "./templeAdministrationPlan";
/** Front work room and direct threshold */
export const templeAdministration = (): IAutoMovieBuiltSpace => ({
  id: "administration", kind: "administration", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("administration.body", templeAdministrationPlan, y.floor, y.lowCeiling),
    ...thresholdCells("administration", templeDoorPassages, y.floor),
  ],
});

