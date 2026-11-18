import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Each bend strategy reaches through its distinct lowering without breaking a contact or the skin bound.
 *
 * Scenarios:
 * 1. The default and the three explicit strategies preserve the original target geometry and the generic physical checks through return.
 * 2. Both acting sides occur. Bilateral symmetry and the strategy's measured literature signatures have separate oracles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The unchanged skin, floor and contact bounds constrain both hands and feet through the staged bend. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases The default and the three explicit strategies preserve the original target geometry and the generic physical checks through return. Both acting sides occur. Bilateral symmetry and the strategy's measured literature signatures have separate oracles.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_bend(): void {
  TestValidator.equals(
    "Each bend strategy reaches through its distinct lowering without breaking a contact or the skin bound",
    motionPostureBranches([
      ["bend", "default", "f-small"],
      ["bend", "strategy=stoop,side=right", "m-large"],
      ["bend", "strategy=semiSquat,side=left", "f-small"],
      ["bend", "strategy=squat", "m-large"],
    ]),
    [],
  );
}
