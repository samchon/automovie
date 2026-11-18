import { TestValidator } from "@nestia/e2e";

import { motionHumanOverlayChannels } from "../internal/motionHumanOverlayChannels";

/**
 * A person performs two actions at once on different parts of the body, read
 * on the average man: walking 2 m with and without the `read` task in the
 * right hand over the walk, the carrier's own channels are left alone, the
 * claimed arm comes up and is held with the trunk, the overlay comes in,
 * runs and goes out without a step in any joint's path, and a combination no
 * body could perform is refused with both claims named.
 *
 * Scenarios (`motionHumanOverlayChannels` states each with its bound):
 * 1. Every unclaimed joint centre of the film with the task (the pelvis, both
 *    legs and the free hand) is the plain walk's within a nanometre at every
 *    twelfth of a second.
 * 2. Every departing interval of the film with the task, over each of its
 *    eight windows (each running one frame into the next), resolves to a
 *    joint displacement within the continuity audit's 5 mm.
 * 3. The reading hand is up and ahead of the chest while the plain walk's
 *    hangs.
 * 4. The reading hand keeps within 3 cm of its distance to the chest.
 * 5. One hand for two tasks, a whole-body action over a walk and a task over
 *    an action that yields nothing are refused as `channel` refusals on `over`.
 * 6. A phone in one hand and a drink in the other plan.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the compositions through the public chain and reads displayed joint centres and thrown refusals; an overlay that disturbs the legs, the pelvis or the free arm, one that steps in or out of the swing, an arm left swinging, a hand that drifts from the trunk or a clash that plans fails.
 * @evidence contracts/development/testing.md#independent-expectations The unclaimed channels are compared with the same walk without the overlay, a metamorphic relation; the continuity bound is the audit's own, which holds for any human motion; where the reading hand is follows from what holding a sheet up is; the refusals follow from one hand doing one thing.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers claimed and unclaimed channels, continuity, three refusal branches and compatible two-hand use on one actor.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and performs the plain walk and the walk with the task once each in memory, every scenario reading those two films, plus the refused and the two-hand compositions; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the films it performs and the 6 scenarios with their bounds.
 */
export function test_human_motion_overlay_channels_m_average(): void {
  const complaints: string[] = [];
  motionHumanOverlayChannels.read("m-average", complaints, true);
  TestValidator.equals("an overlay and its carrier", complaints, []);
}
