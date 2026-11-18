import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * The seat keeps both feet and permits three supported trunk positions, a shift and a rise.
 *
 * Scenarios:
 * 1. Upright, backrest-supported and slumped seating each exercise a distinct trunk/support case.
 * 2. A shift and a rise start from the same chair rather than clearing contacts before the transition.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The chair fixture follows the body-scaled seat contract; the paths must satisfy the same skin, plant and continuity limits as the other posture branches. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases Upright, backrest-supported and slumped seating each exercise a distinct trunk/support case. A shift and a rise start from the same chair rather than clearing contacts before the transition.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_seat(): void {
  TestValidator.equals(
    "The seat keeps both feet and permits three supported trunk positions, a shift and a rise",
    motionPostureBranches([
      ["sit", "default", "f-small"],
      ["sit", "back=lean", "m-large"],
      ["sit", "back=slump", "f-small"],
      ["shift", "default", "m-large"],
      ["rise", "default", "f-small"],
    ]),
    [],
  );
}
