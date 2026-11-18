import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Resting hands reach distinct placements without penetrating the body or each other.
 *
 * Scenarios:
 * 1. Side, pocket and hip separate free carriage, a path near the hip and a fixed hip contact.
 * 2. Crossed, clasped, overhead and asymmetric supports exercise both hands and the points they bear on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations Every placement keeps the original contact, range and continuity bounds on displayed bones. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases Side, pocket and hip separate free carriage, a path near the hip and a fixed hip contact. Crossed, clasped, overhead and asymmetric supports exercise both hands and the points they bear on.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_rest(): void {
  TestValidator.equals(
    "Resting hands reach distinct placements without penetrating the body or each other",
    motionPostureBranches([
      ["rest", "default", "f-small"],
      ["rest", "place=pocket", "m-large"],
      ["rest", "place=hip", "f-small"],
      ["rest", "place=crossed", "m-large"],
      ["rest", "place=claspedFront", "f-small"],
      ["rest", "place=claspedBehind", "m-large"],
      ["rest", "place=behindHead", "f-small"],
      ["rest", "place=chinRest", "m-large"],
      ["rest", "place=elbowSupport", "f-small"],
    ]),
    [],
  );
}
