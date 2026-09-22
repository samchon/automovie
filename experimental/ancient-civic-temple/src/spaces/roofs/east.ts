/**
 * docs/spaces/roofs/east.md#east-roof의 업무 날개 박공.
 * 북쪽 처마만 서비스 마당으로 돌출하고 마당 전체는 덮지 않는다.
 */
import { gablePlanes, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

export const templeEastRoof = (rules: RoofRules) => gablePlanes(
  "roof-east", "roof-east", {
    west: p.eastCourt - rules.overhang, east: p.eastOuter + rules.overhang,
    north: p.yardFront - rules.overhang, south: p.southOuter + rules.overhang,
  }, "x", p.eastCourt, (p.eastOuter + p.eastInner) / 2,
  rules.supportHeight, rules.slope,
);
