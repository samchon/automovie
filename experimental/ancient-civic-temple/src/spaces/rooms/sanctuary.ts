/**
 * Sanctuary body and threshold
 * Caps cells at the actual composite roof underside, without a flat ceiling cut.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import type { RoofPatch } from "../../geometry/planar-domain";
import { roofedCells, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";
export const templeSanctuaryPlan = {
  west: p.westRing, east: p.eastRing, north: p.northInner, south: p.sanctuaryFront,
} as const;

/**
 * Makes only the sanctuary body and existing threshold, without inventing a local altar step.
 */
export const templeSanctuaryFloor = () => roomFloorInput(
  "sanctuary", [{ ...templeSanctuaryPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);
export const templeSanctuary = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "sanctuary", kind: "sanctuary", parent: y.storey, fidelity: "exact",
  cells: [
    ...roofedCells("sanctuary.body", templeSanctuaryPlan, y.floor, roof.filter((patch) => patch.tier === "sanctuary")),
    ...thresholdCells("sanctuary", templeDoorPassages, y.floor),
  ],
});
