import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * A full hands-down support transfer holds its original feet on both extreme rigs.
 *
 * Scenarios:
 * 1. From a two-foot stance, both palms share support before the return to two feet.
 * 2. The same authored transfer on the other extreme body demands the same contact precision.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The original contact, floor and continuity limits apply to all four bearing parts. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases From a two-foot stance, both palms share support before the return to two feet. The same authored transfer on the other extreme body demands the same contact precision.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_support(): void {
  TestValidator.equals(
    "A full hands-down support transfer holds its original feet on both extreme rigs",
    motionPostureBranches([
      ["support", "default", "f-small"],
      ["support", "default", "m-large"],
    ]),
    [],
  );
}
