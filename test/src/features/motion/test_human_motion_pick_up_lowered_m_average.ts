import { motionPickUpLowered } from "../internal/motionPickUpLowered";

/**
 * A prop the standing arm does not reach is picked up by lowering the body
 * toward it, on the average man: a glass on a counter with a slight lean, a tote
 * off the floor by a stoop or a squat, the same tote after a bend cut at its
 * deepest, and a glass too far refused with a step named.
 * `motionPickUpLowered` states the scene and the 5 scenarios with their
 * bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, builds performances through the public chain and reads displayed joints and prop frames; a pick up refused within a lean's reach, a shoulder left out of reach at the grasp, a prop not lifted, a tipped glass, a body left bent, a bend that cannot be cut into the pick up, or a far prop accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations The counter's height is a kitchen counter's, the reach is the body's own upper arm and forearm, the 10 degrees is #3361's and the 10 mm and 90 mm are stated with their reasons.
 * @evidence contracts/development/testing.md#distinguishing-cases A grip at counter height and one on the floor, a pick up alone and one after a bend, and one too far; the other stature is `test_human_motion_pick_up_lowered_f_small`, split so each runs alone in its time.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and two archetypes and builds five short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the scene and the scenarios are stated and the split.
 */
export function test_human_motion_pick_up_lowered_m_average(): void {
  motionPickUpLowered("m-average");
}
