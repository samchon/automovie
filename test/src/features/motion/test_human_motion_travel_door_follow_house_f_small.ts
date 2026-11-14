import { motionDoorFollow } from "../internal/motionDoorFollow";

/**
 * A person pulls a door open past the arm's reach and steps with it, on the
 * small woman (#3520): a house door pulled to 90 degrees over 6 s, the hand
 * on its pull bar and every planted foot still, and the same swing in 0.5
 * s, too fast to follow, refused with the largest swing followed.
 * `motionDoorFollow` states the stage and the 4 scenarios with their
 * bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places a real door archetype whose leaf the scene swings, performs the opening through the public chain and reads the displayed wrist and soles; a person who does not step, a hand that slides off the handle, a foot that slides while planted or a swing too fast accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations The handle's place at each instant is the archetype's own articulation, the plants are the plan's declared windows and both 5 mm bounds are the campaign's; none is read from the law's own solve.
 * @evidence contracts/development/testing.md#distinguishing-cases A swing that is followed and one too fast; the car door is `test_human_motion_travel_door_follow_car_f_small`; the other stature is `test_human_motion_travel_door_follow_house_m_average`, split so each runs alone in its time.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype and builds one opening and one refused plan; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, the door, where the stage and scenarios are stated and the split.
 */
export function test_human_motion_travel_door_follow_house_f_small(): void {
  motionDoorFollow("f-small", "house");
}
