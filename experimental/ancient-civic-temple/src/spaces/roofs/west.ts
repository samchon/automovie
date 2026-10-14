/**
 * West-wing mono-pitch roof of docs/spaces/roofs/west.md#west-roof.
 * Rises from the west courtyard support to the west parapet inner face, covering
 * offering and west colonnade together. Candidates exclude the sanctuary body;
 * north, south and west ends stop at parapet inner faces. Only the courtyard
 * side has eaves with the shared projection.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { leanToPlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

/**
 * @evidence spaces/roofs/west.md Emits candidate west-wing mono-pitch roof patches.
 * @evidence spaces/roofs/west.md#west-roof Rises 12 degrees from west-court to the west parapet inner face, covering offering and west colonnade while clearing the sanctuary body.
 * @evidence principles/core/source-units.md#source-scope-preservation North, south and west ends stop at parapet inner faces; only the courtyard side projects, without new regions.
 * @evidence principles/core/source-units.md#source-substantive-completion leanToPlanes returns two candidates for the full offering length and colonnade region.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the support, slope and two candidate regions of roofs/west.md#west-roof unchanged; the west-inner top at about 4.56m stays below coping.
 */
export const templeWestRoof = (rules: RoofRules) => leanToPlanes({
  owner: "roof-west", id: "roof-west", tier: "wing", axis: "x",
  pieces: [
    rectanglePolygon({ west: p.westInner, east: p.westRoom, north: p.northInner, south: p.southInner }),
    rectanglePolygon({ west: p.westRoom, east: p.westCourt + rules.overhang, north: p.northRing, south: p.southInner }),
  ],
  lowLine: p.westCourt, rising: -1, height: rules.courtEave,
  slope: rules.leanSlope, thickness: roofVerticalThickness(rules, rules.leanSlope),
});
