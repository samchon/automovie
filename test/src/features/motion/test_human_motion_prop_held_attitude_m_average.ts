import { motionPropHeldAttitude } from "../internal/motionPropHeldAttitude";

/**
 * A held object keeps the attitude and the place its use needs, on the
 * average man (#3358, #3361, #3346): a glass is carried upright, tipped
 * toward the lips only as much as the drinking arm asked, its rim at the
 * mouth and its grip kept, and a held cigarette's end reaches the lips.
 * `motionPropHeldAttitude` states the scene and the 4 scenarios with their
 * bounds.
 *
 * The glass's rim and grip on this body were
 * `test_human_motion_prop_held_use_m_average`'s, read off a second film of
 * the same pick-up and drink; they are read here off the one drink film.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, builds performances through the public chain and reads the displayed prop frame, the hand and the mouth region; a glass tipped in the carry, tipped away from the face or past its asked lean at the mouth, a rim away from the mouth, a glass that slides in the hand, or a cigarette short of the lips fails.
 * @evidence contracts/development/testing.md#independent-expectations The carry's bound and the rim's 15 mm are the acceptance lines of #3361, the grip's 1 mm #3358's, and the mouth's is the lean the law asked, read off its asked hand rotation, plus one search step; the cigarette's bound is #3346's; the lip and the mouth end are the archetypes' own affordances.
 * @evidence contracts/development/testing.md#distinguishing-cases A vessel whose attitude, rim and grip matter and a rod whose end matters on the average man; the other stature is `test_human_motion_prop_held_attitude_f_small`, split so each runs alone in its time; the phone and the refusals of a held prop are `test_human_motion_prop_held_use_m_average`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and two archetypes and builds two short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the scene and the scenarios are stated, the split and the readings moved here.
 */
export function test_human_motion_prop_held_attitude_m_average(): void {
  motionPropHeldAttitude("m-average");
}
