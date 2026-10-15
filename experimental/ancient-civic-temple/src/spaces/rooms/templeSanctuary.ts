/**
 * Sanctuary body and threshold
 * Caps cells at the actual composite roof underside, without a flat ceiling cut.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import type { RoofPatch } from "../../geometry/RoofPatch";
import { thresholdCells } from "../../geometry/thresholdCells";
import { roofedCells } from "../../geometry/roofedCells";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeLevels as y } from "../templeLevels";
import { templeSanctuaryPlan } from "./templeSanctuaryPlan";
export const templeSanctuary = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "sanctuary", kind: "sanctuary", parent: y.storey, fidelity: "exact",
  cells: [
    ...roofedCells("sanctuary.body", templeSanctuaryPlan, y.floor, roof.filter((patch) => patch.tier === "sanctuary")),
    ...thresholdCells("sanctuary", templeDoorPassages, y.floor),
  ],
});
