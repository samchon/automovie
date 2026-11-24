import type { IAutoMovieVector3 } from "@automovie/interface";
import { pickUpStepReach } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a square root, metres. */
const ROUNDING: number = 1e-12;

/**
 * `pickUpStepReach` is the shortest step toward a direction that brings the
 * stepping body's middle, half the step along, within every place's reach: the
 * line along the direction meets each reach sphere over an interval, the
 * intervals and the longest step's half intersect, and the step is twice the
 * nearest point; none where they do not meet.
 *
 * Scenarios, stepping along +Z from the origin:
 *
 * 1. A place 1 m ahead within 0.5 m is met from 0.5 m on: a 1 m step, the
 *    longest 2 m.
 * 2. With the longest step 0.8 m its half, 0.4 m, falls short: none.
 * 3. A place 0.6 m to the side within 0.5 m is never met: none.
 * 4. A place already within reach asks no step.
 */
export function test_unit_motions_handling_pick_up_step_reach(): void {
  const from: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const toward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const ahead: pickUpStepReach.IReach = [{ x: 0, y: 0, z: 1 }, 0.5];
  TestValidator.predicate(
    "a step ahead",
    nclose(pickUpStepReach(from, toward, [ahead], 2)!, 1, ROUNDING),
  );
  TestValidator.equals(
    "out of reach",
    [
      pickUpStepReach(from, toward, [ahead], 0.8),
      pickUpStepReach(from, toward, [[{ x: 0.6, y: 0, z: 1 }, 0.5]], 2),
    ],
    [null, null],
  );
  TestValidator.equals(
    "within reach",
    pickUpStepReach(from, toward, [[{ x: 0, y: 0, z: 0.2 }, 0.5]], 2),
    0,
  );
}
