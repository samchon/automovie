/**
 * Work-wing gable of docs/spaces/roofs/east.md#east-roof. Its ridge lies between
 * the east courtyard support (colonnade eave height) and east exterior wall
 * centre (higher support); unequal support heights shift the ridge east of the
 * midpoint. Only the east wall and yard-facing north end have shared-projection
 * eaves. The south end stops at the south parapet's inner face and leaves part of the yard open.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { gablePlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

/**
 * @evidence spaces/roofs/east.md Emits candidate patches of the work wing's east gable.
 * @evidence spaces/roofs/east.md#east-roof The 19-degree gable between east-court 3.20m and east exterior-wall centre 3.55m puts its ridge at X≈7.36; only the east wall and yard-facing north end project, while the south end stops at the parapet inner face.
 * @evidence principles/core/source-units.md#source-scope-preservation Takes eastGableSlope and rule-owned support heights, without covering the complete yard.
 * @evidence principles/core/source-units.md#source-substantive-completion gablePlanes partitions both ridge sides by region and returns their plans, heights and thicknesses.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements both supports, 19-degree slope and four region ends of roofs/east.md#east-roof unchanged; the south ridge remains below the coping underside at about 4.53m.
 */
export const templeEastRoof = (rules: RoofRules) => gablePlanes({
  owner: "roof-east", id: "roof-east", tier: "wing", axis: "x",
  pieces: [rectanglePolygon({
    west: p.eastCourt - rules.overhang, east: p.eastOuter + rules.overhang,
    north: p.yardFront - rules.overhang, south: p.southInner,
  })],
  supportLow: p.eastCourt, supportHigh: (p.eastOuter + p.eastInner) / 2,
  height: rules.courtEave, highHeight: rules.eastWallSupport,
  slope: rules.eastGableSlope, thickness: roofVerticalThickness(rules, rules.eastGableSlope),
});
