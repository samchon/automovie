import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * One knee, both knees and sitting back keep the required contacts through return.
 *
 * Scenarios:
 * 1. The one-knee default and the explicit left knee exercise either support side.
 * 2. Both-knee and sit-back positions exercise distinct depths. Remaining down is verified by core base transitions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The skin and plant bounds apply across each change of bearing parts. Bilateral symmetry has its own relation. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases The one-knee default and the explicit left knee exercise either support side. Both-knee and sit-back positions exercise distinct depths. Remaining down is verified by core base transitions.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_kneel(): void {
  TestValidator.equals(
    "One knee, both knees and sitting back keep the required contacts through return",
    motionPostureBranches([
      ["kneel", "default", "m-large"],
      ["kneel", "kind=one,knee=left", "f-small"],
      ["kneel", "kind=both", "m-large"],
      ["kneel", "kind=sitBack", "f-small"],
    ]),
    [],
  );
}
