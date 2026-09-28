/**
 * docs/spaces/roofs/porch.md#porch-roof의 정면 포치 박공.
 * 두 반환벽 파라펫의 안쪽 면 사이에 놓이고 앞쪽만 남측 외벽 바깥으로
 * 공통 돌출한다. 뒤끝은 현관 후퇴벽의 북쪽 면까지 벽 위에 얹히며 옆 처마는 없다.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { gablePlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

/**
 * @evidence spaces/roofs/porch.md 정면 포치 박공 후보 조각을 낸다.
 * @evidence spaces/roofs/porch.md#porch-roof 두 반환벽 파라펫 안쪽 면 사이에 22도 박공을 두고 앞쪽만 south-outer 밖으로 0.35m 돌출하며 뒤끝은 후퇴벽 북쪽 면에서 끝난다.
 * @evidence principles/core/source-units.md#source-scope-preservation 지지 4.00m·경사·두께는 규칙 값에서 받고 옆 처마를 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion gablePlanes로 용마루 X=0 양쪽에 west-porch-inner~east-porch-inner 폭의 두 조각을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work roofs/porch.md#porch-roof의 폭·앞 돌출·뒤끝을 그대로 구현했다.
 */
export const templePorchRoof = (rules: RoofRules) => gablePlanes({
  owner: "roof-porch", id: "roof-porch", tier: "porch", axis: "x",
  pieces: [rectanglePolygon({
    west: p.westPorchInner, east: p.eastPorchInner,
    north: p.entranceBack, south: p.southOuter + rules.overhang,
  })],
  supportLow: p.westPorchInner, supportHigh: p.eastPorchInner, height: rules.porchSupport,
  slope: rules.gableSlope, thickness: roofVerticalThickness(rules, rules.gableSlope),
});
