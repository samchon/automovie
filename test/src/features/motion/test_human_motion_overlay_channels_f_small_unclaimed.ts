import { TestValidator } from "@nestia/e2e";

import { motionHumanOverlayChannels } from "../internal/motionHumanOverlayChannels";

/**
 * A task overlaid on a walk leaves the carrier's own channels alone, read on
 * the small woman: walking 2 m with and without the `read` task in the right
 * hand, the pelvis, the hips, knees and ankles and the free hand stand where
 * the plain walk has them at every twelfth of a second, within a nanometre.
 *
 * Scenarios (`motionHumanOverlayChannels` states each with its bound):
 * 1. Every unclaimed joint centre of the film with the task is the plain
 *    walk's.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs both films through the public chain and reads displayed joint centres; an overlay that disturbs the legs, the pelvis or the free arm fails.
 * @evidence contracts/development/testing.md#independent-expectations The unclaimed channels are compared with the same walk without the overlay, a metamorphic relation.
 * @evidence contracts/development/testing.md#distinguishing-cases The pelvis, both legs and the free hand, over the whole walk, on one of two bodies; the claimed arm, the refusals and the continuity are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and performs two films in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, its scenario and its bound.
 */
export function test_human_motion_overlay_channels_f_small_unclaimed(): void {
  const complaints: string[] = [];
  motionHumanOverlayChannels.read("f-small", "unclaimed", complaints);
  TestValidator.equals("an overlay and its carrier", complaints, []);
}
