import {
  HumanArmTrajectoryPace
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectoryPace";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** One rounded division and one rounded multiplication at unit time scale. */
const TIME_ROUNDING: number = 2 * Number.EPSILON;

/**
 * The earliest duration for the resampled trajectory is strictly after the
 * requested span on the 30 Hz admission clock.
 *
 * Scenarios:
 *
 * 1. A span already on frame 2 advances to frame 3.
 * 2. A span halfway between frames 2 and 3 advances to the same frame.
 * 3. An unbounded duration remains unbounded.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the first admission frame strictly after the request and preserves unbounded duration.
 * @evidence contracts/development/testing.md#behavioral-verification Queries duration at exact frame 2, halfway to frame 3 and at infinity.
 * @evidence contracts/development/testing.md#independent-expectations Both finite fixtures advance to frame 3 on the stated 30 Hz clock, including the exact frame boundary.
 */
export function test_motions_posture_arm_pace(): void {
  TestValidator.predicate(
    "the first frame strictly after the span",
    nclose(HumanArmTrajectoryPace.duration(2 / 30), 3 / 30, TIME_ROUNDING) &&
      nclose(HumanArmTrajectoryPace.duration(2.5 / 30), 3 / 30, TIME_ROUNDING),
  );
  TestValidator.equals(
    "the unbounded duration remains unbounded",
    HumanArmTrajectoryPace.duration(Infinity),
    Infinity,
  );
}
