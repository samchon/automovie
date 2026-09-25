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

/**
 * @evidence spaces/roofs/east.md 업무 날개의 동측 박공 후보 조각을 낸다.
 * @evidence spaces/roofs/east.md#east-roof east-court 3.20m와 동측 외벽 중심 3.55m 두 지지선 사이 19도 박공으로 용마루가 X≈7.36에 오고, 동측 외벽과 마당 쪽 북단만 돌출하며 남단은 파라펫 안쪽 면에서 끝난다.
 * @evidence principles/core/source-units.md#source-scope-preservation 경사는 eastGableSlope, 지지 높이는 규칙 값에서 받고 마당 전체를 덮지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion gablePlanes로 용마루 양쪽 조각을 영역별로 나눠 평면·높이·두께를 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work roofs/east.md#east-roof의 두 지지선·19도·영역 네 끝선을 그대로 구현했고 남쪽 용마루가 코핑 아랫면 아래(약 4.53m)에 든다.
 * @evidenceReview spaces/roofs/east.md # 동측 박공의 한 후보 polygon을 gablePlanes 양 경사면으로 내고 마당 북쪽 끝과 남측 파라펫 끝을 다르게 다룬다.
 * @evidenceReview spaces/roofs/east.md#east-roof # eastCourt 지지 3.20과 동측 벽 중심 지지 3.55를 19도 gablePlanes에 넣어 비중앙 X 약 7.36 용마루와 남쪽 돌출 없는 끝을 얻는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 경사와 지지 높이는 rules를 받고 북쪽만 yardFront−overhang까지 가므로 마당 전체 위에 지붕을 새로 올리지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # gablePlanes가 서로 다른 지지 높이를 가진 두 면의 polygon·height·thickness를 반환해 업무 날개 박공이 단일 평판으로 납작해지지 않는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 동측 원본의 두 지지선·19도·남단 southInner를 실제 인자에 대조했고 용마루 약 4.53m가 코핑 아랫면 4.69m보다 낮아 부모 수정이 필요하지 않았다.
 */
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
