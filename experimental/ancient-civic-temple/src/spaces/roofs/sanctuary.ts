/**
 * docs/spaces/roofs/sanctuary.md#sanctuary-roof의 후면 제실 박공.
 * 날개 지붕보다 높은 별도 합성 단위이며 네 끝의 처마는 아래 날개 지붕과
 * 마당 위에 떠 있고 아래 지붕을 지우지 않는다. 상면은 지붕, 실내 하부는 제실 소유다.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { gablePlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

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
