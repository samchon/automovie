import { TestValidator } from "@nestia/e2e";

import type { motionHumanBody } from "../internal/motionHumanBody";
import { motionPickUpLift } from "../internal/motionPickUpLift";

/**
 * Pick-up lifts the object through the requested range or refuses its unreachable height.
 *
 * Scenarios:
 * 1. An admitted lift reaches the authored height by the lifted event.
 * 2. A lift beyond the limb's reachable height refuses on the lift axis and reports how to reduce it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the real pick-up branch, decisive event and refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed glass at the named lifted event and checks the refusal from the real law.
 * @evidence contracts/development/testing.md#independent-expectations The requested height is independent of the chosen path. The documented clearance bounds apply to both body scales.
 * @evidence contracts/development/testing.md#distinguishing-cases The small woman's reach and the average man's reach on their own normalized stages preserve both limiting geometries.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario instantiates the actors and archetypes in memory and gathers all reports before the final assertion.
 */
export function test_human_motion_pick_up_lift(): void {
  const complaints: string[] = [];
  for (const name of BODIES) motionPickUpLift(name, complaints);
  TestValidator.equals("Pick-up lifts the object through the requested range or refuses its unreachable height", complaints, []);
}

/** Bodies of different proportions in the original observed stages. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-average"];
