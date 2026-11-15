import { motionDoorFollow } from "../internal/motionDoorFollow";

/**
 * A person pulls a door open past the arm's reach and steps with it, on the
 * average man (#3520): a sedan's driver door pulled to its stop over 4 s,
 * the hand on its handle and every planted foot still. `motionDoorFollow`
 * states the stage and its 3 scenarios with their bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places a real car archetype whose leaf the scene swings, performs the opening through the public chain and reads the displayed wrist and soles; a person who does not step, a hand that slides off the handle or a foot that slides while planted fails.
 * @evidence contracts/development/testing.md#independent-expectations The handle's place at each instant is the archetype's own articulation, the plants are the plan's declared windows and both 5 mm bounds are the campaign's; none is read from the law's own solve.
 * @evidence contracts/development/testing.md#distinguishing-cases A car door swung about its own hinge; the house door and the swing too fast are `test_human_motion_travel_door_follow_house_m_average`; the other stature is `test_human_motion_travel_door_follow_car_f_small`, split so each runs alone in its time.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype and builds one opening; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, the door, where the stage and scenarios are stated and the split.
 */
export function test_human_motion_travel_door_follow_car_m_average(): void {
  motionDoorFollow("m-average", "car");
}
