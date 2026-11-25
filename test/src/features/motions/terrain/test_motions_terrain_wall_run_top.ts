import { HumanRefusal, planWallRun } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Four positive terms below 3 m require at most 8 binary64 rounding units. */
const ROUNDING: number = 8 * Number.EPSILON * 3;

/**
 * Compare the staged top to the hand's vertical limit from its wall step.
 *
 * Scenarios:
 *
 * 1. The 0.55 m step plus a 1.25 m shoulder and 0.75 m arm reaches 2.55 m, or 4.55
 *    m in world coordinates when the floor stands at 2 m.
 * 2. A top at 4.6 m is refused with the 2.55 m local bound and its 0.05 m miss.
 */
export function test_motions_terrain_wall_run_top(): void {
  const measure: planWallRun.IReachMeasure = {
    hipHeight: 1,
    shoulderHeight: 1.25,
    upperArm: 0.5,
    forearm: 0.25,
  };
  planWallRun.admitTop(2.55, 0, measure, "lip");
  planWallRun.admitTop(4.55, 2, measure, "lip");
  let refusal: HumanRefusal | undefined;
  try {
    planWallRun.admitTop(4.6, 2, measure, "lip");
  } catch (error: unknown) {
    if (!(error instanceof HumanRefusal)) throw error;
    refusal = error;
  }
  const range = refusal?.feasible;
  TestValidator.predicate(
    "report the geometric limit relative to the stage floor",
    refusal?.axis === "top" &&
      refusal.reason.includes("0.050 m") &&
      range?.kind === "range" &&
      range.maximum !== null &&
      nclose(range.maximum, 2.55, ROUNDING),
  );
}
