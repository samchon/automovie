/**
 * Front porch gable Sits between the
 * inner faces of both return-wall parapets, projecting by the shared amount
 * only forward beyond the south wall. The rear rests on the recessed entrance
 * wall up to its north face; there are no side eaves.
 */
import { rectanglePolygon } from "../../geometry/rectanglePolygon";
import { roofVerticalThickness } from "../../geometry/roofVerticalThickness";
import { gablePlanes } from "../../geometry/gablePlanes";
import { type RoofRules } from "../../geometry/RoofRules";
import { templePlan as p } from "../templePlan";
export const templePorchRoof = (rules: RoofRules) => gablePlanes({
  owner: "roof-porch", id: "roof-porch", tier: "porch", axis: "x",
  pieces: [rectanglePolygon({
    west: p.westPorchInner, east: p.eastPorchInner,
    north: p.entranceBack, south: p.southOuter + rules.overhang,
  })],
  supportLow: p.westPorchInner, supportHigh: p.eastPorchInner, height: rules.porchSupport,
  slope: rules.gableSlope, thickness: roofVerticalThickness(rules, rules.gableSlope),
});
