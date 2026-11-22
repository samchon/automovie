import { diningCut, diningRun } from "../internal/diningUtensils";

/**
 * Knife and fork, continental, seated at a table (#4005), right-handed on
 * m-average and left-handed on f-small.
 *
 * Scenarios:
 * 1. The fork's tines pin the steak while the knife saws across it, its
 *    working point crossing the food.
 * 2. The fork takes the cut piece, a food of its own, which rides the fork
 *    to the mouth.
 * 3. A plate beyond the seated reach is refused (once, on m-average).
 * 4. The take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies, the handedness and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, write with a steadying fork, a take and eatWith, and reads displayed utensils, food and bones.
 * @evidence contracts/development/testing.md#independent-expectations The food's places are the archetypes' contacts; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners, the saw against the take, a plate within against beyond reach.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_human_motion_dining_utensils_cut(): void {
  diningRun("knife and fork", diningCut);
}
