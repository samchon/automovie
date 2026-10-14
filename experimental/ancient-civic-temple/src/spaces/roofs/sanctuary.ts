/**
 * Rear sanctuary gable of docs/spaces/roofs/sanctuary.md#sanctuary-roof.
 * A separate composition unit above the wing roof; eaves at all four ends float
 * above wing roofs and yard without erasing lower roofs. The roof owns the top;
 * sanctuary owns the interior underside.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { gablePlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

/**
 * @evidence spaces/roofs/sanctuary.md This one coordinate is the high-side support of the sanctuary roof, shared with the timber models.
 * @evidence spaces/roofs/sanctuary.md#sanctuary-roof The high-side support is the midpoint of the two east sanctuary wall faces; roof and model members consume this single datum.
 * @evidence principles/core/source-units.md#source-scope-preservation This value supplies one roof contact coordinate, with no patch, wall, or model geometry of its own.
 * @evidence principles/core/source-units.md#source-substantive-completion The numeric midpoint is available to the sanctuary roof and both dependent timber builders as one constant.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed wall faces and their midpoint already define the 5.75 m support; sharing it exposes no missing parent decision.
 */
export const templeSanctuarySupportHigh = (p.eastRoom + p.eastRing) / 2;

/**
 * @evidence spaces/roofs/sanctuary.md Emits candidate patches of the rear sanctuary gable.
 * @evidence spaces/roofs/sanctuary.md#sanctuary-roof Builds a gable with support 5.35m, slope 22 degrees, four-end eaves 0.35m and ridge about 7.67m; eaves float over lower wing roofs and yard.
 * @evidence principles/core/source-units.md#source-scope-preservation Keeps a separate unit without composing it with or erasing wing roofs.
 * @evidence principles/core/source-units.md#source-substantive-completion gablePlanes returns two patches extending beyond west-room/east-room by the eave width.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements support, slope and eaves from roofs/sanctuary.md#sanctuary-roof unchanged; the west eave underside remains above the offering coping at about 4.95m.
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
