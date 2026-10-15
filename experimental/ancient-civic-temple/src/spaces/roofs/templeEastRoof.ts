import { rectanglePolygon } from "../../geometry/rectanglePolygon";
import { roofVerticalThickness } from "../../geometry/roofVerticalThickness";
import { gablePlanes } from "../../geometry/gablePlanes";
import { type RoofRules } from "../../geometry/RoofRules";
import { templePlan as p } from "../templePlan";
/**
 * Work-wing gable Its ridge lies between
 * the east courtyard support (colonnade eave height) and east exterior wall
 * centre (higher support); unequal support heights shift the ridge east of the
 * midpoint. Only the east wall and yard-facing north end have shared-projection
 * eaves. The south end stops at the south parapet's inner face and leaves part of the yard open.
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
