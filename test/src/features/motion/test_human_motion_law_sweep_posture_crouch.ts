import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * The two crouch depths and the independent heel branch keep their supported path.
 *
 * Scenarios:
 * 1. The default flat heel and the explicitly raised partial heel distinguish the pivot branch.
 * 2. The full depth exercises its default lifted heel; the adjacent full-flat refusal is owned by core base transitions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The original floor, skin, contact and limit bounds still apply to each admitted posture. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases The default flat heel and the explicitly raised partial heel distinguish the pivot branch. The full depth exercises its default lifted heel; the adjacent full-flat refusal is owned by core base transitions.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_crouch(): void {
  TestValidator.equals(
    "The two crouch depths and the independent heel branch keep their supported path",
    motionPostureBranches([
      ["crouch", "default", "f-small"],
      ["crouch", "depth=partial,heels=up", "m-large"],
      ["crouch", "depth=full", "m-large"],
    ]),
    [],
  );
}
