import {
  HUMAN_ATTRIBUTE_EFFECTS,
  HumanCrowd,
  run,
  walk,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few products and square roots. */
const ROUNDING: number = 1e-12;

/**
 * `HumanCrowd.desired` is a member's desired speed, its gait's Froude speed
 * `sqrt(Fr g l)` at its hip height scaled by its keyed normal draw and by
 * fatigue, and `half` its half breadth at the shoulders, the shoulder joint's
 * half width and the upper arm's radius.
 *
 * Scenarios, the member at index 2 of ensemble `crowd` seeded `pairs`:
 *
 * 1. The same draw at a hip four times as high walks twice as fast.
 * 2. Running is faster by `sqrt(Fr_run / Fr_walk)`.
 * 3. Fully fatigued walks slower by the fatigue's pace effect, high over low.
 * 4. With no latency asked the member starts at once.
 * 5. The half breadth of 0.19 m shoulders and 0.05 m arms is 0.24 m.
 */
export function test_unit_motions_ensemble_human_crowd_desired(): void {
  const ensemble: HumanCrowd.IDesiredEnsemble = {
    input: { seed: "pairs", id: "crowd" },
  };
  const member: (hip: number, fatigue?: number) => HumanCrowd.IDesiredMember = (
    hip: number,
    fatigue?: number,
  ): HumanCrowd.IDesiredMember => ({
    index: 2,
    proficiency: { level: "trained" },
    attributes: fatigue === undefined ? {} : { fatigue },
    body: { measure: { hipHeight: hip } },
  });
  const walking: (m: HumanCrowd.IDesiredMember) => number = (
    m: HumanCrowd.IDesiredMember,
  ): number => HumanCrowd.desired(ensemble, m, { gait: "walk" }).speed;
  TestValidator.predicate(
    "the hip's scale",
    nclose(walking(member(1)), 2 * walking(member(0.25)), ROUNDING),
  );
  TestValidator.predicate(
    "running",
    nclose(
      HumanCrowd.desired(ensemble, member(0.9), { gait: "run" }).speed,
      walking(member(0.9)) *
        Math.sqrt(run.GAITS.run.froude / walk.FROUDE.normal),
      ROUNDING,
    ),
  );
  const pace: { low: number; high: number } =
    HUMAN_ATTRIBUTE_EFFECTS.fatigue.pace;
  TestValidator.predicate(
    "fatigued",
    nclose(
      walking(member(0.9, 1)),
      (walking(member(0.9, 0)) * pace.high) / pace.low,
      ROUNDING,
    ),
  );
  TestValidator.equals(
    "no latency",
    HumanCrowd.desired(ensemble, member(0.9), { gait: "walk" }).delay,
    0,
  );
  TestValidator.predicate(
    "the half breadth",
    nclose(
      HumanCrowd.half({
        body: { measure: { shoulderHalfWidth: 0.19, upperArmRadius: 0.05 } },
      }),
      0.24,
      ROUNDING,
    ),
  );
}
