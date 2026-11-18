import { TestValidator } from "@nestia/e2e";

import { motionRowVerdicts } from "../internal/motionRowVerdicts";

/**
 * The small woman brings the fingertips to the lips. The forearm path stays continuous through the upside of its twist range.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the registered row and reads the displayed bones with the full verdict at 24 Hz.
 * @evidence contracts/development/testing.md#independent-expectations The original verdict limits apply, including the 10 mm penetration and 5 mm continuity limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses the original cast, quiet stance, contact and return of this lip gesture.
 * @evidence contracts/development/testing.md#execution-ownership Builds one film on a prepared body and audits it in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Names the pose, cast and observed regression.
 */
export function test_human_motion_hand_verdicts_kiss(): void {
  TestValidator.equals(
    "the blownKiss holds the physical bounds throughout its film",
    motionRowVerdicts("blownKiss", "f-small"),
    "clean",
  );
}
