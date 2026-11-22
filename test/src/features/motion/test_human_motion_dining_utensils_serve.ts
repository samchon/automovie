import { diningRun, diningServe } from "../internal/diningUtensils";

/**
 * Serving seated at a table (#4005), right-handed on m-average and
 * left-handed on f-small.
 *
 * Scenarios:
 * 1. A spoon takes food from the platter.
 * 2. It leaves the food on the neighbour's plate, where it rests.
 * 3. The take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies and the handedness.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp and two writes, a take and a leave, and reads the displayed food.
 * @evidence contracts/development/testing.md#independent-expectations The food's places are the archetypes' contacts; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners, the scoop against the placing.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_human_motion_dining_utensils_serve(): void {
  diningRun("serving", diningServe);
}
