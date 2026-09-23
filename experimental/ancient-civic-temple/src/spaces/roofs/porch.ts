/**
 * docs/spaces/roofs/porch.md#porch-roof의 정면 포치 박공.
 * 두 반환벽 파라펫의 안쪽 면 사이에 놓이고 앞쪽만 남측 외벽 바깥으로
 * 공통 돌출한다. 뒤끝은 현관 후퇴벽의 북쪽 면까지 벽 위에 얹히며 옆 처마는 없다.
 */
import { rectanglePolygon } from "../../geometry/planar-domain";
import { gablePlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

export const templePorchRoof = (rules: RoofRules) => gablePlanes({
  owner: "roof-porch", id: "roof-porch", tier: "porch", axis: "x",
  pieces: [rectanglePolygon({
    west: p.westPorchInner, east: p.eastPorchInner,
    north: p.entranceBack, south: p.southOuter + rules.overhang,
  })],
  supportLow: p.westPorchInner, supportHigh: p.eastPorchInner, height: rules.porchSupport,
  slope: rules.gableSlope, thickness: roofVerticalThickness(rules, rules.gableSlope),
});
