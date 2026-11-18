import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Lying on the back, front or side changes support without skating or penetrating the floor.
 *
 * Scenarios:
 * 1. The default back-down and explicit front-down routes use different bearing sides.
 * 2. Left and right lateral routes enter on opposite limbs and retain distinct observed supports.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The same floor, tangle and contact limits constrain every route. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases The default back-down and explicit front-down routes use different bearing sides. Left and right lateral routes enter on opposite limbs and retain distinct observed supports.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_lie_down(): void {
  TestValidator.equals(
    "Lying on the back, front or side changes support without skating or penetrating the floor",
    motionPostureBranches([
      ["lieDown", "default", "f-small"],
      ["lieDown", "position=prone", "m-large"],
      ["lieDown", "position=lateralLeft", "f-small"],
      ["lieDown", "position=lateralRight", "m-large"],
    ]),
    [],
  );
}
