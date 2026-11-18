import { TestValidator } from "@nestia/e2e";

import type { motionHumanBody } from "../internal/motionHumanBody";
import { motionPickUpStep } from "../internal/motionPickUpStep";

/**
 * Pick-up takes the one adjustment step necessary to reach the object.
 *
 * Scenarios:
 * 1. With the glass beyond the standing reach, the foot takes one step toward it while the planted contacts stay fixed.
 * 2. A target beyond the permitted step refuses on the proper reach axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the real pick-up branch, decisive event and refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the actual plants and glass after the requested motion, including the full planted-foot audit.
 * @evidence contracts/development/testing.md#independent-expectations The glass is set relative to the shoulder and the length of the arm independent of planning. The verdict uses the existing contact and display limits.
 * @evidence contracts/development/testing.md#distinguishing-cases The small woman's reach and the average man's reach on their own normalized stages preserve both limiting geometries.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario instantiates the actors and archetypes in memory and gathers all reports before the final assertion.
 */
export function test_human_motion_pick_up_step(): void {
  const complaints: string[] = [];
  for (const name of BODIES) motionPickUpStep(name, complaints);
  TestValidator.equals("Pick-up takes the one adjustment step necessary to reach the object", complaints, []);
}

/** Bodies of different proportions in the original observed stages. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-average"];
