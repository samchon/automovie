/**
 * docs/spaces/roofs/west.md#west-roof의 서측 날개 외쪽 지붕.
 * 중정 서쪽 지지선에서 서측 파라펫 안쪽 면으로 올라가며 봉헌실과 서쪽
 * 주랑을 함께 덮는다. 제실 몸체 영역은 후보에서 빠지고, 북·남·서 끝은
 * 파라펫 안쪽 면에서 끝난다. 중정 쪽만 공통 돌출의 처마를 가진다.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { leanToPlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

export const templeWestRoof = (rules: RoofRules) => leanToPlanes({
  owner: "roof-west", id: "roof-west", tier: "wing", axis: "x",
  pieces: [
    rectanglePolygon({ west: p.westInner, east: p.westRoom, north: p.northInner, south: p.southInner }),
    rectanglePolygon({ west: p.westRoom, east: p.westCourt + rules.overhang, north: p.northRing, south: p.southInner }),
  ],
  lowLine: p.westCourt, rising: -1, height: rules.courtEave,
  slope: rules.leanSlope, thickness: roofVerticalThickness(rules, rules.leanSlope),
});
