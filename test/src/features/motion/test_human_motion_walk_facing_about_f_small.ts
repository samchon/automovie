import { motionWalkFacing } from "../internal/motionWalkFacing";

/**
 * A walk set off from standing toward a way the body does not face, on
 * the small woman: it turns about where it stands, then walks.
 * `motionWalkFacingAbout` states the walks and the scenarios with their
 * bounds and sources.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the walks through the public chain and reads the displayed hips, pelvis and the shipped foot verdicts; hips that sink below the body's own gait, a body that walks off before it has turned about, a foot that slides, lifts or sinks while planted, a foot declared spinning where the hip could take the turn, or a walk that misses its end fails.
 * @evidence contracts/development/testing.md#independent-expectations The ways are the ones asked, the lowest hips the same body's straight walk of the same length, the hip's range DEFAULT_HUMANOID_ROM's, the foot bounds the campaign's; none is read from the turn's own rule.
 * @evidence contracts/development/testing.md#distinguishing-cases A turn of half a turn against one of a quarter, both against the straight walk; the other stature is `test_human_motion_walk_facing_about_m_average`, split so each runs alone in its time.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds four short walks with two verdicts; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the scenarios are stated and the split.
 */
export function test_human_motion_walk_facing_about_f_small(): void {
  motionWalkFacing("f-small", "about");
}
