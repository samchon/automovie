import { motionPickUpLift } from "../internal/motionPickUpLift";

/**
 * A pick up lifts what it is asked, or refuses the lift, on the average man.
 * `motionPickUpLift` states the stage and the 2 scenarios with their
 * bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Picks a real glass up through the public chain and reads the displayed glass at the plan's own lifted event; a lift short of what is asked, or a lift above any reach accepted, fails.
 * @evidence contracts/development/testing.md#independent-expectations The asked lifts and the 90 mm are the test's own; nothing is read from the law's search.
 * @evidence contracts/development/testing.md#distinguishing-cases A lift within reach against one above it; the other stature is `test_human_motion_pick_up_lift_f_small`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds two short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the stage and scenarios are stated and the split.
 */
export function test_human_motion_pick_up_lift_m_average(): void {
  motionPickUpLift("m-average");
}
