import { motionPickUpSeated } from "../internal/motionPickUpSeated";

/**
 * A seated person picks up a glass beyond the seated arm by leaning forward
 * from the seat, on the average man, and one past any lean is refused.
 * `motionPickUpSeated` states the stage and the 5 scenarios with their
 * bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Seats a polygon man and picks a real glass up through the public chain, reading the displayed glass, chest and soles and the plan's declared seat; a pick up refused, a trunk that does not lean, a seat let go, a foot that slides or a glass past any lean accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations The glass is placed by the seated body's own shoulder and arm, read here; the foot bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases A glass the lean reaches against one past it; the other stature is `test_human_motion_pick_up_seated_f_small`, split so each runs alone in its time.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds three short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the stage and scenarios are stated and the split.
 */
export function test_human_motion_pick_up_seated_m_average(): void {
  motionPickUpSeated("m-average", "pick");
}
