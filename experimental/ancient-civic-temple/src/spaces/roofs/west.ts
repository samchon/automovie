/**
 * docs/spaces/roofs/west.md#west-roof의 봉헌실/서측 주랑 공통 박공.
 * 외벽 바깥면과 중정 경계에서 처마를 잰다. 내부 천장은 방에 귀속한다.
 */
import { gablePlanes, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

export const templeWestRoof = (rules: RoofRules) => gablePlanes(
  "roof-west", "roof-west", {
    west: p.westOuter - rules.overhang, east: p.westCourt + rules.overhang,
    north: p.northOuter - rules.overhang, south: p.southOuter + rules.overhang,
  }, "x", (p.westOuter + p.westInner) / 2, p.westCourt,
  rules.supportHeight, rules.slope,
);
