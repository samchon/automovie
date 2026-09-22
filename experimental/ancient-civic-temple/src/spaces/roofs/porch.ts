/**
 * docs/spaces/roofs/porch.md#porch-roof의 낮은 중앙 포치 박공.
 * 3.42m는 지지선의 상면 값이며 기둥/보 받침 높이로 직접 쓰지 않는다.
 */
import { gablePlanes, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

export const templePorchRoof = (rules: RoofRules) => gablePlanes(
  "roof-porch", "roof-porch", {
    west: p.westPorchOuter - rules.overhang, east: p.eastPorchOuter + rules.overhang,
    north: p.entranceBack - rules.overhang, south: p.southOuter + rules.overhang,
  }, "x", p.westPorch, p.eastPorch, 3.42, rules.slope,
);
