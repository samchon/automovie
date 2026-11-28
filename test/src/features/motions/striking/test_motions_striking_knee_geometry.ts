import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  KneeGeometry
} from "../../../../../packages/motions/src/striking/internal/KneeGeometry";
import type {
  KneeReach
} from "../../../../../packages/motions/src/striking/internal/KneeReach";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** A solve that puts the knee at the hip. */
const reach = (hip: IAutoMovieVector3): KneeReach.ISolution => ({
  knee: hip,
  ankle: hip,
  thrust: { x: 0, y: 0, z: 0 },
  heading: { x: 0, y: 0, z: 1 },
  status: "reached",
});

/**
 * A knee strike's hip settle (`KneeGeometry.settle`): the hip is the fixed
 * point of the carriage under the solve it carries, iterated until it moves
 * within the tolerance; a pass whose move does not shrink is refused.
 *
 * Scenarios:
 *
 * 1. A carriage halving the hip's distance from x = 2 settles on (2, 1, 0) from
 *    (0, 1, 0), its solve read from that hip.
 * 2. One doubling it never settles and is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines a virtual hip fixed point and nonconvergent-carriage refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Feeds settle a contractive carriage toward x = 2 and a carriage that doubles its displacement.
 * @evidence contracts/development/testing.md#independent-expectations Repeated halving converges from (0, 1, 0) to (2, 1, 0) and the final solved pose must use that point. Increasing movement cannot converge under the admission rule.
 */
export function test_motions_striking_knee_geometry(): void {
  const refuse = (change: number): AutoMovieMotionHumanRefusal =>
    new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "target",
      value: change,
      reason: "unsettled",
      fix: "none",
    });
  const settled = KneeGeometry.settle(
    { x: 0, y: 1, z: 0 },
    reach,
    (at: KneeReach.ISolution): IAutoMovieVector3 => ({
      ...at.knee,
      x: (at.knee.x + 2) / 2,
    }),
    refuse,
  );
  TestValidator.predicate(
    "settled",
    KneeGeometry.TOLERANCE > 0 &&
      vclose(settled.hip, { x: 2, y: 1, z: 0 }, 2 * KneeGeometry.TOLERANCE) &&
      vclose(settled.solved.knee, settled.hip, 1e-12),
  );
  TestValidator.predicate(
    "unsettled",
    throwsError(() =>
      KneeGeometry.settle(
        { x: 1, y: 1, z: 0 },
        reach,
        (at: KneeReach.ISolution): IAutoMovieVector3 => ({
          ...at.knee,
          x: 2 * at.knee.x + 1,
        }),
        refuse,
      ),
    ),
  );
}
