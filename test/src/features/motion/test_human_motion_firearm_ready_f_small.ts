import { motionFirearmReady } from "../internal/motionFirearmReady";

/**
 * A pistol drawn off a counter and presented at the high and the low ready,
 * on the small woman: the bore inside the doctrine's region and the pistol kept
 * in the hand. `motionFirearmReady` states the stage and the 3 scenarios
 * with their bounds and sources.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the draw and the presentation through the public chain with real handgun and table archetypes and reads the displayed pistol and hand; a carriage refused, a bore outside the region or a pistol that drifts in the hand fails.
 * @evidence contracts/development/testing.md#independent-expectations The region's angles are the doctrine's (US Army TC 3-22.9), stated in the reader, not read from the law; the grip bound is the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases The high ready against the low ready; the other stature is `test_human_motion_firearm_ready_m_average`, split so each runs alone in its time.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds two short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the stage and scenarios are stated and the split.
 */
export function test_human_motion_firearm_ready_f_small(): void {
  motionFirearmReady("f-small");
}
