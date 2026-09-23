/**
 * docs/spaces/roofs/colonnade.md의 남북 주랑 외쪽 지붕.
 * 북쪽은 court-back 지지선에서 제실 남벽 면으로, 남쪽은 court-front
 * 지지선에서 남측 파라펫 안쪽 면으로 올라간다. 남쪽 후보는 현관 몸체
 * (후퇴벽·반환벽·포치 영역)를 비우고 서측 끝은 서측 파라펫까지 이어져
 * 모서리 골을 서측 지붕과 합성한다. 북쪽 동쪽 끝은 마당 위 박공 끝 돌출이다.
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
