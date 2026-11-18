import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Getting up preserves contacts from lying through the symmetric and rolling transitions.
 *
 * Scenarios:
 * 1. The default symmetric route uses the original supine entry on the small rig.
 * 2. The rotation route rolls before standing on the large rig. Other entry bases have their own geometry spec.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The original floor, skin, continuity and declared plant limits apply through both paths. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases The default symmetric route uses the original supine entry on the small rig. The rotation route rolls before standing on the large rig. Other entry bases have their own geometry spec.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_get_up(): void {
  TestValidator.equals(
    "Getting up preserves contacts from lying through the symmetric and rolling transitions",
    motionPostureBranches([
      ["getUp", "default", "f-small"],
      ["getUp", "pattern=rotation", "m-large"],
    ]),
    [],
  );
}
