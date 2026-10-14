/**
 * Front porch gable of docs/spaces/roofs/porch.md#porch-roof. Sits between the
 * inner faces of both return-wall parapets, projecting by the shared amount
 * only forward beyond the south wall. The rear rests on the recessed entrance
 * wall up to its north face; there are no side eaves.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { gablePlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

/**
 * @evidence spaces/roofs/porch.md Emits candidate patches of the front porch gable.
 * @evidence spaces/roofs/porch.md#porch-roof Places a 22-degree gable between return-wall parapet inner faces, projecting 0.35m forward only beyond south-outer and ending at the recessed wall's north face.
 * @evidence principles/core/source-units.md#source-scope-preservation Takes support 4.00m, slope and thickness from the rules and makes no side eaves.
 * @evidence principles/core/source-units.md#source-substantive-completion gablePlanes returns two patches across west-porch-inner~east-porch-inner on either side of ridge X=0.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the width, front projection and rear end of roofs/porch.md#porch-roof unchanged.
 */
export const templePorchRoof = (rules: RoofRules) => gablePlanes({
  owner: "roof-porch", id: "roof-porch", tier: "porch", axis: "x",
  pieces: [rectanglePolygon({
    west: p.westPorchInner, east: p.eastPorchInner,
    north: p.entranceBack, south: p.southOuter + rules.overhang,
  })],
  supportLow: p.westPorchInner, supportHigh: p.eastPorchInner, height: rules.porchSupport,
  slope: rules.gableSlope, thickness: roofVerticalThickness(rules, rules.gableSlope),
});
