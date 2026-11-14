import { motionPropHeldAttitude } from "../internal/motionPropHeldAttitude";

/**
 * A held object keeps the attitude its use needs, on the average man: a glass is
 * carried upright and tipped toward the lips only as much as the drinking
 * arm asked, and a held cigarette's end reaches the lips.
 * `motionPropHeldAttitude` states the scene and the 2 scenarios with their
 * bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, builds performances through the public chain and reads the displayed prop frame and the mouth region; a glass tipped in the carry, tipped away from the face or past its asked lean at the mouth, or a cigarette short of the lips fails.
 * @evidence contracts/development/testing.md#independent-expectations The carry's bound is the acceptance line of #3361 and the mouth's is the lean the law asked, read off its asked hand rotation, plus one search step; the cigarette's bound is #3346's; the mouth end is the archetype's own affordance.
 * @evidence contracts/development/testing.md#distinguishing-cases A vessel whose attitude matters and a rod whose end matters on the average man; the other stature is `test_human_motion_prop_held_attitude_f_small`, split so each runs alone in its time; the rim's place and the grip's drift are the `test_human_motion_prop_held_use_*` specs'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and two archetypes and builds two short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the scene and the scenarios are stated and the split.
 */
export function test_human_motion_prop_held_attitude_m_average(): void {
  motionPropHeldAttitude("m-average");
}
