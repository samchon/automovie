import { rectanglePolygon } from "../../geometry/rectanglePolygon";
import { roofVerticalThickness } from "../../geometry/roofVerticalThickness";
import { gablePlanes } from "../../geometry/gablePlanes";
import { type RoofRules } from "../../geometry/RoofRules";
import { templePlan as p } from "../templePlan";
import { templeSanctuarySupportHigh } from "./templeSanctuarySupportHigh";
/**
 * Rear sanctuary gable
 * A separate composition unit above the wing roof; eaves at all four ends float
 * above wing roofs and yard without erasing lower roofs. The roof owns the top;
 * sanctuary owns the interior underside.
 */
export const templeSanctuaryRoof = (rules: RoofRules) => gablePlanes({
  owner: "roof-sanctuary", id: "roof-sanctuary", tier: "sanctuary", axis: "x",
  pieces: [rectanglePolygon({
    west: p.westRoom - rules.overhang, east: p.eastRoom + rules.overhang,
    north: p.northOuter - rules.overhang, south: p.northRing + rules.overhang,
  })],
  supportLow: (p.westRoom + p.westRing) / 2, supportHigh: templeSanctuarySupportHigh,
  height: rules.sanctuarySupport, slope: rules.gableSlope,
  thickness: roofVerticalThickness(rules, rules.gableSlope),
});
