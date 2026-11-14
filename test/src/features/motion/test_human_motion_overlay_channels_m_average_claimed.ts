import { TestValidator } from "@nestia/e2e";

import { motionHumanOverlayChannels } from "../internal/motionHumanOverlayChannels";

/**
 * A person performs two actions at once on different parts of the body, read
 * on the average man: walking 2 m with and without the `read` task in the
 * right hand over the walk, the claimed arm comes up and is held with the
 * trunk, and a combination no body could perform is refused with both claims
 * named.
 *
 * Scenarios (`motionHumanOverlayChannels` states each with its bound):
 * 1. The reading hand is up and ahead of the chest while the plain walk's
 *    hangs.
 * 2. The reading hand keeps within 3 cm of its distance to the chest.
 * 3. One hand for two tasks, a whole-body action over a walk and a task over
 *    an action that yields nothing are refused as `channel` refusals on `over`.
 * 4. A phone in one hand and a drink in the other plan.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the compositions through the public chain and reads displayed joint centres and thrown refusals; an arm left swinging, a hand that drifts from the trunk or a clash that plans fails.
 * @evidence contracts/development/testing.md#independent-expectations Where the reading hand is follows from what holding a sheet up is; the refusals follow from one hand doing one thing.
 * @evidence contracts/development/testing.md#distinguishing-cases The claimed arm, three kinds of clash and one combination that is not a clash, on one of two bodies; the other body, the unclaimed channels and the continuity are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and performs two films in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, its part of the overlay scenarios and their bounds.
 */
export function test_human_motion_overlay_channels_m_average_claimed(): void {
  const complaints: string[] = [];
  motionHumanOverlayChannels.read("m-average", "claimed", complaints);
  TestValidator.equals("an overlay and its carrier", complaints, []);
}
