/**
 * North/south colonnade mono-pitch roofs
 * The north roof rises from court-back to the sanctuary south-wall face; the
 * south rises from court-front to the south parapet inner face. South candidates
 * clear the entrance body (recessed wall, return walls and porch); their west
 * ends reach the west parapet, composing corner valleys with the west roof.
 * The north roof's east end projects over the yard at the gable end.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { leanToPlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";
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
