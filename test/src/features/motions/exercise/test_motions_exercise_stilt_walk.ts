import {
  stiltWalk
} from "../../../../../packages/motions/src/exercise/internal/stiltWalk";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `stiltWalk` law's pacing (`stiltWalk.pacing`): a natural step of 0.35 hip
 * heights, by default enough steps to cover the way plus one and at least two,
 * each 0.8 s, and half a step to settle.
 *
 * Scenarios:
 *
 * 1. Two metres on a 1 m hip: a 0.35 m step, ceil(5.71) + 1 = 7 steps of 1/3 m, 6
 *    s in all.
 * 2. No way still takes two steps in place, 2 s.
 * 3. 2.5 steps asked round to three; a count rounding to none is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Stilt walking covers distance with its default step count and settles even in place.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the pacing function for two metres, zero distance, and authored fractional or insufficient counts.
 * @evidence contracts/development/testing.md#independent-expectations A 0.35 m natural step determines seven steps over two metres. The 0.8-second period and half-step settle determine duration separately from distance.
 */
export function test_motions_exercise_stilt_walk(): void {
  const walk: stiltWalk.IPacing = stiltWalk.pacing(2, 1, undefined);
  TestValidator.predicate(
    "over a way",
    nclose(walk.step, 0.35, 1e-12) &&
      walk.steps === 7 &&
      nclose(walk.stride, 1 / 3, 1e-12) &&
      nclose(walk.duration, 6, 1e-12),
  );
  const still: stiltWalk.IPacing = stiltWalk.pacing(0, 1, undefined);
  TestValidator.predicate(
    "in place",
    still.steps === 2 && still.stride === 0 && nclose(still.duration, 2, 1e-12),
  );
  TestValidator.predicate(
    "the asked count",
    stiltWalk.pacing(2, 1, 2.5).steps === 3 &&
      throwsError(() => stiltWalk.pacing(2, 1, 0.4)),
  );
}
