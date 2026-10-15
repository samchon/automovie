/**
 * West-wing mono-pitch roof
 * Rises from the west courtyard support to the west parapet inner face, covering
 * offering and west colonnade together. Candidates exclude the sanctuary body;
 * north, south and west ends stop at parapet inner faces. Only the courtyard
 * side has eaves with the shared projection.
 */
import { rectanglePolygon } from "../../geometry/rectanglePolygon";
import { roofVerticalThickness } from "../../geometry/roofVerticalThickness";
import { leanToPlanes } from "../../geometry/leanToPlanes";
import { type RoofRules } from "../../geometry/RoofRules";
import { templePlan as p } from "../templePlan";
export const templeWestRoof = (rules: RoofRules) => leanToPlanes({
  owner: "roof-west", id: "roof-west", tier: "wing", axis: "x",
  pieces: [
    rectanglePolygon({ west: p.westInner, east: p.westRoom, north: p.northInner, south: p.southInner }),
    rectanglePolygon({ west: p.westRoom, east: p.westCourt + rules.overhang, north: p.northRing, south: p.southInner }),
  ],
  lowLine: p.westCourt, rising: -1, height: rules.courtEave,
  slope: rules.leanSlope, thickness: roofVerticalThickness(rules, rules.leanSlope),
});
