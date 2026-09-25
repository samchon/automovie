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
 * @evidenceReview spaces/roofs/porch.md #13cf7cc # 두 반환벽 안쪽 사이의 독립 tier porch 박공을 생성하고 전면 처마만 건물 외곽 밖으로 내민다.
 * @evidenceReview spaces/roofs/porch.md#porch-roof #215aa7a # westPorchInner~eastPorchInner가 옆 처마 없는 폭이고 entranceBack부터 southOuter+0.35까지라 후퇴벽이 뒤끝, 앞 돌출이 정면이 된다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 지지 4.00m와 22도, 두께는 rules에서 받고 기둥·삼각 막음·반환벽 실체는 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # gablePlanes가 X=0 용마루 양쪽의 두 RoofPatch를 반환해 포치 지붕이 열린 전면 위의 실제 경사 실체로 조립된다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 원본의 3.30m 반환벽 안쪽 폭과 앞 0.35m 돌출·뒤 entranceBack을 후보 영역에 맞췄고 코핑 높이를 바꿀 필요가 없었다.
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
