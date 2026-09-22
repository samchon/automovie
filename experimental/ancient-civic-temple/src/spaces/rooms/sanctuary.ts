/**
 * docs/spaces/rooms/sanctuary.md#sanctuary-volume의 제실 본체와 문턱.
 * 평평한 천장으로 자르지 않고 합성된 실제 지붕 하부를 cell 상한으로 쓴다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import type { RoofPatch } from "../../geometry/planar-domain";
import { roofedCells, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeRoofRules } from "../roofs/assembly";
import { templeLevels as y } from "../storey";

export const templeSanctuaryPlan = {
  west: p.westRing, east: p.eastRing, north: p.northInner, south: p.sanctuaryFront,
} as const;

export const templeSanctuary = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "sanctuary", kind: "sanctuary", parent: y.storey, fidelity: "exact",
  cells: [
    ...roofedCells("sanctuary.body", templeSanctuaryPlan, y.floor, roof, templeRoofRules.verticalThickness),
    ...thresholdCells("sanctuary", templeDoorPassages, y.floor),
  ],
});
