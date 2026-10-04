import type { IHumanSourceLoss } from "./IHumanSourceLoss.ts";
import type { IHumanSourceReproductionRow } from "./IHumanSourceReproductionRow.ts";

/**
 * Body reproduction result. `g1Targets` are the body skin endpoints in
 * one-skin ids and `p1Targets` on the complementary P1 body surface, both
 * ascending sparse rows; vertices whose value is unknown are omitted and the
 * endpoint is listed in `unavailable` with its reason. `newOriginals` are
 * body-side source vertices the published body never had and `droppedR16`
 * published body vertices on the head side of the cut (r16 vertex ids).
 */
export interface IHumanSourceBodyReproduction {
  rows: IHumanSourceReproductionRow[];
  losses: IHumanSourceLoss[];
  g1Targets: Record<string, number[]>;
  p1Targets: Record<string, number[]>;
  unavailable: Record<string, string>;
  newOriginals: number[];
  droppedR16: number[];
  checks: Record<string, number | boolean | string>;
}
