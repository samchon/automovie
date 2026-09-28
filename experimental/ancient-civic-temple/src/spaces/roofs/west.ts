/**
 * docs/spaces/roofs/west.md#west-roof의 서측 날개 외쪽 지붕.
 * 중정 서쪽 지지선에서 서측 파라펫 안쪽 면으로 올라가며 봉헌실과 서쪽
 * 주랑을 함께 덮는다. 제실 몸체 영역은 후보에서 빠지고, 북·남·서 끝은
 * 파라펫 안쪽 면에서 끝난다. 중정 쪽만 공통 돌출의 처마를 가진다.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { leanToPlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

/**
 * @evidence spaces/roofs/west.md 서측 날개 외쪽 지붕 후보 조각을 낸다.
 * @evidence spaces/roofs/west.md#west-roof west-court 지지선에서 서측 파라펫 안쪽 면으로 12도 올라가 봉헌실과 서쪽 주랑을 덮고 제실 몸체 영역은 비운다.
 * @evidence principles/core/source-units.md#source-scope-preservation 북·남·서 끝은 파라펫 안쪽 면에서 끝나고 중정 쪽만 돌출하며 새 영역을 더하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion leanToPlanes로 봉헌실 전 길이와 주랑 영역 두 후보를 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work roofs/west.md#west-roof의 지지선·경사·두 후보 영역을 그대로 구현했고 west-inner 상면(약 4.56m)이 코핑보다 낮다.
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
