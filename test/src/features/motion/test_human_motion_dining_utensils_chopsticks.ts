import { diningChopsticks, diningRun } from "../internal/diningUtensils";

/**
 * Chopsticks seated at a table (#4005), right-handed on m-average and
 * left-handed on f-small.
 *
 * Scenarios:
 * 1. The tips close on a morsel, which stays between them to the mouth.
 * 2. The fixed stick stays still in the hand.
 * 3. The other hand lifts the rice bowl to the chin.
 * 4. The take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies and the handedness.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, write, workHeld with a take, a second pickUp and workHeld, and eatWith, and reads displayed sticks, food, bowl and bones.
 * @evidence contracts/development/testing.md#independent-expectations The food's places are the archetypes' contacts; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners, the pinching against the holding hand.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_human_motion_dining_utensils_chopsticks(): void {
  diningRun("chopsticks", diningChopsticks);
}
