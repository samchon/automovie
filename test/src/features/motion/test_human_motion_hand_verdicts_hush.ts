import { TestValidator } from "@nestia/e2e";

import { motionRowVerdicts } from "../internal/motionRowVerdicts";

/**
 * The average man keeps the forefinger across the lips without placing the curled fingers inside the neck or switching the fitted arm branch.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the registered row and reads the displayed bones with the full verdict at 24 Hz.
 * @evidence contracts/development/testing.md#independent-expectations The original verdict limits apply, including the 10 mm penetration and 5 mm continuity limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses the original cast, quiet stance, contact and return of this lip gesture.
 * @evidence contracts/development/testing.md#execution-ownership Builds one film on a prepared body and audits it in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Names the pose, cast and observed regression.
 */
export function test_human_motion_hand_verdicts_hush(): void {
  TestValidator.equals(
    "the hush holds the physical bounds throughout its film",
    motionRowVerdicts("hush", "m-average"),
    "clean",
  );
}
