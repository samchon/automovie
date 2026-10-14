/**
 * North/south colonnade mono-pitch roofs of docs/spaces/roofs/colonnade.md.
 * The north roof rises from court-back to the sanctuary south-wall face; the
 * south rises from court-front to the south parapet inner face. South candidates
 * clear the entrance body (recessed wall, return walls and porch); their west
 * ends reach the west parapet, composing corner valleys with the west roof.
 * The north roof's east end projects over the yard at the gable end.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { leanToPlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

/**
 * @evidence spaces/roofs/colonnade.md Emits candidate south/north colonnade mono-pitch roof patches.
 * @evidence spaces/roofs/colonnade.md#north-canopy Rises 12 degrees from court-back to the sanctuary south-wall face, with the east end projecting over the yard.
 * @evidence spaces/roofs/colonnade.md#south-canopy Rises 12 degrees from court-front to the south parapet inner face, clearing the entrance body (recessed wall, return walls and porch).
 * @evidence principles/core/source-units.md#source-scope-preservation Takes support heights, slopes, thickness and projection from templeRoofRules; region ends use only datums.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns plans, heights and thicknesses for leanToPlanes' one north and three south patches.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements both mono-pitch supports, slopes and regions of roofs/colonnade.md unchanged.
 */
export const templeColonnadeRoof = (rules: RoofRules) => {
  const thickness = roofVerticalThickness(rules, rules.leanSlope);
  const north = leanToPlanes({
    owner: "roof-colonnade", id: "roof-colonnade.north", tier: "wing", axis: "z",
    pieces: [rectanglePolygon({
      west: p.westRing, east: p.eastRoom + rules.overhang,
      north: p.northRing, south: p.courtBack + rules.overhang,
    })],
    lowLine: p.courtBack, rising: -1, height: rules.courtEave, slope: rules.leanSlope, thickness,
  });
  const south = leanToPlanes({
    owner: "roof-colonnade", id: "roof-colonnade.south", tier: "wing", axis: "z",
    pieces: [
      rectanglePolygon({ west: p.westInner, east: p.eastRing, north: p.courtFront - rules.overhang, south: p.entranceBack }),
      rectanglePolygon({ west: p.westInner, east: p.westPorchOuter, north: p.entranceBack, south: p.southInner }),
      rectanglePolygon({ west: p.eastPorchOuter, east: p.eastRing, north: p.entranceBack, south: p.southInner }),
    ],
    lowLine: p.courtFront, rising: 1, height: rules.courtEave, slope: rules.leanSlope, thickness,
  });
  return [...north, ...south];
};
