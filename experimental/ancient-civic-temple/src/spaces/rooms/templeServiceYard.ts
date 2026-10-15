import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { thresholdCells } from "../../geometry/thresholdCells";
import { levelCell } from "../../geometry/levelCell";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeRoofRules } from "../roofs/templeRoofRules";
import { templeLevels as y } from "../templeLevels";
import { templeServiceYardPlan } from "./templeServiceYardPlan";
/**
 * Open service yard
 * Both west/east thresholds belong to this yard, without new ground or ceilings.
 */
export const templeServiceYard = (): IAutoMovieBuiltSpace => ({
  id: "service-yard", kind: "service-yard", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("service-yard.body", templeServiceYardPlan, y.floor, templeRoofRules.courtEave),
    ...thresholdCells("service-yard", templeDoorPassages, y.floor),
  ],
});
