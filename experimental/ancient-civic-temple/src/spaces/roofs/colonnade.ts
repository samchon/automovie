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

/**
 * @evidence spaces/roofs/colonnade.md 남·북 주랑 외쪽 지붕 후보 조각을 낸다.
 * @evidence spaces/roofs/colonnade.md#north-canopy court-back 지지선에서 제실 남벽 면으로 12도 올라가고 동쪽 끝은 마당 위 돌출을 가진다.
 * @evidence spaces/roofs/colonnade.md#south-canopy court-front 지지선에서 남측 파라펫 안쪽 면으로 12도 올라가며 현관 몸체(후퇴벽·반환벽·포치 영역)를 비운다.
 * @evidence principles/core/source-units.md#source-scope-preservation 지지 높이·경사·두께·돌출은 templeRoofRules에서 받고 영역 끝선은 기준선으로만 정한다.
 * @evidence principles/core/source-units.md#source-substantive-completion leanToPlanes로 만든 북 1개·남 3개 조각의 평면·높이·두께를 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work roofs/colonnade.md의 두 외쪽 지붕 지지선·경사·영역을 그대로 구현했다.
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
