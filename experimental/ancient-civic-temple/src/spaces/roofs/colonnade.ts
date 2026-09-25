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
 * @evidenceReview spaces/roofs/colonnade.md # 북쪽 한 polygon과 현관 몸체를 비운 남쪽 세 polygon을 모두 roof-colonnade 후보로 내어 한 주랑 지붕 소유를 유지한다.
 * @evidenceReview spaces/roofs/colonnade.md#north-canopy # courtBack에서 북쪽으로 오르는 12도 면은 northRing에서 끝나고 동쪽 마당 쪽 끝은 eastRoom+overhang까지 나가되 마당 전체를 덮지 않는다.
 * @evidenceReview spaces/roofs/colonnade.md#south-canopy # courtFront에서 남쪽으로 오르는 면을 entranceBack 뒤에서 양쪽 꼬리로 나눠 후퇴벽·반환벽·포치 몸체를 지붕 후보에서 비운다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # leanSlope·courtEave·normalThickness·overhang을 rules로 받고 기준선 p 밖에서 새 지지 높이를 선택하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # leanToPlanes가 북쪽 한 조각과 남쪽 세 조각의 높이 평면·수직 두께를 만들어 두 고리 구간의 지붕 후보를 반환한다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # northRing과 southInner 끝선 및 현관 제외 세 영역을 두 parent H2와 비교해 지붕 연결을 위해 마당을 덮거나 주랑을 분할할 필요가 없었다.
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
