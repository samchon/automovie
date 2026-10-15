/**
 * One long room
 * Includes a low ceiling and wall-depth threshold without a hidden rear room.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { thresholdCells } from "../../geometry/thresholdCells";
import { levelCell } from "../../geometry/levelCell";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeLevels as y } from "../templeLevels";
import { templeOfferingPlan } from "./templeOfferingPlan";
export const templeOffering = (): IAutoMovieBuiltSpace => ({
  id: "offering", kind: "offering", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("offering.body", templeOfferingPlan, y.floor, y.lowCeiling),
    ...thresholdCells("offering", templeDoorPassages, y.floor),
  ],
});

