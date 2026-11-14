import { motionPropHeldUse } from "../internal/motionPropHeldUse";

/**
 * A hand-to-face task is performed with the object the hand holds, on
 * the small woman (#3358, #3361, #3346): a person picks a glass up and drinks from its rim, the glass held in place through it (scenarios 1 and 3). `motionPropHeldUse` states
 * the placement and the 4 scenarios with their bounds and sources.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, builds performances through the public chain and reads the displayed prop frame, hand and face regions; a hand that goes to the face for an implied tool while the glass misses the mouth, a prop that slides in the hand or an unheld prop carried along fails.
 * @evidence contracts/development/testing.md#independent-expectations The rim and the screen are the archetypes' own affordances; 15 mm and 1 mm are the acceptance bounds of #3361 and #3358.
 * @evidence contracts/development/testing.md#distinguishing-cases A vessel on the small woman; the other stature is `test_human_motion_prop_held_use_m_average`, split so each runs alone in its time. The glass's uprightness and the held cigarette are the `test_human_motion_prop_held_attitude_*` specs'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype and builds one short performance; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, what it reads, where the scenarios are stated and the split.
 */
export function test_human_motion_prop_held_use_f_small(): void {
  motionPropHeldUse("f-small");
}
