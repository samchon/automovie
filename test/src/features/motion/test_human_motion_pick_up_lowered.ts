import { TestValidator } from "@nestia/e2e";

import type { motionHumanBody } from "../internal/motionHumanBody";
import { motionPickUpLowered } from "../internal/motionPickUpLowered";

/**
 * Pick-up reaches lower targets through the appropriate posture and preserves the entry cut.
 *
 * Scenarios:
 * 1. An object within a lean's reach and a floor object both lift with their original orientation.
 * 2. Entering the lift from the deepest bend preserves ruled contacts and shows the same use goal.
 * 3. A target past this body's lowering reach refuses with the adjustment step named.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the real pick-up branch, decisive event and refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed hand and prop poses, unchanged plants and the resulting upright pose. Missed lifts and broken cut continuity remain observable.
 * @evidence contracts/development/testing.md#independent-expectations The target positions are authored independently of the solve. Their reach is bounded by the two arm lengths and the documented output clearances.
 * @evidence contracts/development/testing.md#distinguishing-cases The small woman's reach and the average man's reach on their own normalized stages preserve both limiting geometries.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario instantiates the actors and archetypes in memory and gathers all reports before the final assertion.
 */
export function test_human_motion_pick_up_lowered(): void {
  const complaints: string[] = [];
  for (const name of BODIES) motionPickUpLowered(name, complaints);
  TestValidator.equals("Pick-up reaches lower targets through the appropriate posture and preserves the entry cut", complaints, []);
}

/** Bodies of different proportions in the original observed stages. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-average"];
