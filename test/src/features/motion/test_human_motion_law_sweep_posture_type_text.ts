import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Typing a fixed sequence at a real keyboard keeps wrist and finger geometry admissible.
 *
 * Scenarios:
 * 1. The small rig reaches the keyboard with the same task-matched relative working distance used in the existing stage.
 * 2. The tall rig encounters the same key sequence with different hand and limb proportions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The keyboard frame comes from its real affordances; hand, digit and arm error are evaluated by the same physical detectors as other postures. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases The small rig reaches the keyboard with the same task-matched relative working distance used in the existing stage. The tall rig encounters the same key sequence with different hand and limb proportions.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_type_text(): void {
  TestValidator.equals(
    "Typing a fixed sequence at a real keyboard keeps wrist and finger geometry admissible",
    motionPostureBranches([
      ["typeText", "default", "f-small"],
      ["typeText", "default", "m-large"],
    ]),
    [],
  );
}
