import { TestValidator } from "@nestia/e2e";

import { motionKissMeeting } from "../../../../features/internal/motionKissMeeting";

/**
 * The planted mouth meets the named anatomical skin within 5 mm throughout the hold.
 *
 * Scenarios:
 * 1. A high forehead beyond the sole-to-mouth chain refuses, while the same cast placed at an independently bowed mouth accepts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The planted mouth meets the named anatomical skin within 5 mm throughout the hold.
 * @evidence contracts/development/testing.md#independent-expectations Actual bone transforms place the independent skin landmarks; the partner penetration allowance is 10 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases A high forehead beyond the sole-to-mouth chain refuses, while the same cast placed at an independently bowed mouth accepts.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_forehead_meeting(): void {
  TestValidator.equals(
    "the lips meet their named skin target",
    motionKissMeeting("forehead"),
    [],
  );
}
