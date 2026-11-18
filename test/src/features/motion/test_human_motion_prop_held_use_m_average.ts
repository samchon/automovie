import { motionPropHeldUse } from "../internal/motionPropHeldUse";

/**
 * A hand-to-face task is performed with the object the hand holds, on the
 * average man (#3358, #3346): a person picks a phone up and holds its screen
 * to the ear, the phone held in place through it, and a held glass is
 * refused what it cannot be asked. `motionPropHeldUse` states the placement
 * and the 3 scenarios with their bounds and sources.
 *
 * The drink from a held glass, its rim at the mouth and its grip, is the
 * `test_human_motion_prop_held_attitude_*` specs', read on both statures off
 * the one drink film that also gives the glass's attitude; this spec
 * performed the same pick-up and drink a second time for them, and the
 * small woman's spec, which read only the glass, is gone.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, builds performances through the public chain and reads the displayed prop frame, hand and ear region and the thrown refusals; a screen away from the ear, a phone that slides in the hand, a drink from an unheld glass or from a point the glass lacks that is not refused on its axis fails.
 * @evidence contracts/development/testing.md#independent-expectations The screen is the archetype's own affordance; 15 mm and 1 mm are the acceptance bounds of #3346 and #3358; the refused axes are the ones the asked prop and point lack.
 * @evidence contracts/development/testing.md#distinguishing-cases A flat device at the ear, and two refusals on different axes, on the average man: one body, since a device at the ear and a refusal are no stature's measure. The glass's drink, its attitude, rim and grip, and the held cigarette are the `test_human_motion_prop_held_attitude_*` specs'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and two archetypes and builds three short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, what it reads, where the scenarios are stated and where the glass's drink is read.
 */
export function test_human_motion_prop_held_use_m_average(): void {
  motionPropHeldUse("m-average");
}
