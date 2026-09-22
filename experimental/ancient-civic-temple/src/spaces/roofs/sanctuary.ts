/**
 * docs/spaces/roofs/sanctuary.md#sanctuary-roof의 후면 박공 후보.
 * 상면 소유는 지붕, 실내 하부 소유는 제실이다. 합성 전에만 겹칠 수 있다.
 */
import { gablePlanes, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";

export const templeSanctuaryRoof = (rules: RoofRules) => gablePlanes(
  "roof-sanctuary", "roof-sanctuary", {
    west: p.westRoom - rules.overhang, east: p.eastRoom + rules.overhang,
    north: p.northOuter - rules.overhang, south: p.northRing + rules.overhang,
  }, "x", (p.westRoom + p.westRing) / 2,
  (p.eastRoom + p.eastRing) / 2, rules.supportHeight, rules.slope,
);
