import { motionPickUpStep } from "../internal/motionPickUpStep";

/**
 * A standing pick up takes one adjustment step toward a glass beyond the
 * arm and the trunk's turn, on the small woman, and refuses one past a step.
 * `motionPickUpStep` states the stage and the 4 scenarios with their
 * bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Picks a real glass up through the public chain and reads the displayed glass and feet and the plan's declared plants; a pick up refused, a foot that never steps or steps away, a foot that slides while planted or a glass past one step accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations The glass is placed by the body's own shoulder and arm, read here; the foot bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases A glass one step away against one past a step; the other stature is `test_human_motion_pick_up_step_m_average`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds three short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the stage and scenarios are stated and the split.
 */
export function test_human_motion_pick_up_step_f_small(): void {
  motionPickUpStep("f-small");
}
