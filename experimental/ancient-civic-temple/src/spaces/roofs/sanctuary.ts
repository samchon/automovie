/**
 * docs/spaces/roofs/sanctuary.md#sanctuary-roof의 후면 제실 박공.
 * 날개 지붕보다 높은 별도 합성 단위이며 네 끝의 처마는 아래 날개 지붕과
 * 마당 위에 떠 있고 아래 지붕을 지우지 않는다. 상면은 지붕, 실내 하부는 제실 소유다.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { gablePlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

/**
 * @evidence spaces/roofs/sanctuary.md 후면 제실 박공 후보 조각을 낸다.
 * @evidence spaces/roofs/sanctuary.md#sanctuary-roof 지지 5.35m, 22도, 네 끝 0.35m 처마로 용마루 약 7.67m의 박공을 만들고 처마는 아래 날개 지붕과 마당 위에 떠 있다.
 * @evidence principles/core/source-units.md#source-scope-preservation 날개 지붕과 합성하지 않는 별도 단위로 두며 아래 지붕을 지우지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion gablePlanes로 west-room·east-room 밖 처마 폭까지 펼친 두 조각을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work roofs/sanctuary.md#sanctuary-roof의 지지·경사·처마를 그대로 구현했고 서쪽 처마 하부가 봉헌실 코핑 위(약 4.95m)에 남는다.
 * @evidenceReview spaces/roofs/sanctuary.md # 제실 박공을 wing과 별도 sanctuary tier로 내어 서·남 처마 아래의 낮은 지붕을 차집합으로 지우지 않는다.
 * @evidenceReview spaces/roofs/sanctuary.md#sanctuary-roof # 지지선 두 중심에서 5.35m·22도 박공을 만들고 west/eastRoom, northOuter/northRing 네 끝에 0.35m 열린 처마를 준다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 지지·경사·돌출은 rules를 받으며 이 함수는 아래 봉헌실·주랑 roof patch를 잘라내지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # gablePlanes의 두 slope patch와 법선 두께의 수직 변환이 약 7.67m 용마루·약 4.95m 서측 처마 하부를 실제 입력으로 만든다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 높아진 지지 5.35m와 열린 네 처마 끝을 parent에 대조했으며 서쪽 처마 아래가 코핑 4.85m 위로 남아 부모 값을 다시 바꾸지 않았다.
 */
export const templeSanctuaryRoof = (rules: RoofRules) => gablePlanes({
  owner: "roof-sanctuary", id: "roof-sanctuary", tier: "sanctuary", axis: "x",
  pieces: [rectanglePolygon({
    west: p.westRoom - rules.overhang, east: p.eastRoom + rules.overhang,
    north: p.northOuter - rules.overhang, south: p.northRing + rules.overhang,
  })],
  supportLow: (p.westRoom + p.westRing) / 2, supportHigh: (p.eastRoom + p.eastRing) / 2,
  height: rules.sanctuarySupport, slope: rules.gableSlope,
  thickness: roofVerticalThickness(rules, rules.gableSlope),
});
