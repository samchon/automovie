/**
 * docs/spaces/roofs/east.md#east-roof의 업무 날개 박공.
 * 중정 동쪽 지지선(주랑 처마 높이)과 동측 외벽 중심(더 높은 지지) 사이의
 * 용마루이며, 두 지지 높이 차이로 용마루가 중점보다 동쪽에 있다. 동측 외벽과 마당
 * 쪽 북단만 공통 돌출의 처마를 가진다. 남단은 남측 파라펫 안쪽 면에서
 * 끝나고 마당 전체는 덮지 않는다.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { gablePlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

export const templeEastRoof = (rules: RoofRules) => gablePlanes({
  owner: "roof-east", id: "roof-east", tier: "wing", axis: "x",
  pieces: [rectanglePolygon({
    west: p.eastCourt - rules.overhang, east: p.eastOuter + rules.overhang,
    north: p.yardFront - rules.overhang, south: p.southInner,
  })],
  supportLow: p.eastCourt, supportHigh: (p.eastOuter + p.eastInner) / 2,
  height: rules.courtEave, highHeight: rules.eastWallSupport,
  slope: rules.eastGableSlope, thickness: roofVerticalThickness(rules, rules.eastGableSlope),
});
