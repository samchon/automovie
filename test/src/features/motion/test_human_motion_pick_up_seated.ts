import { TestValidator } from "@nestia/e2e";

import type { motionHumanBody } from "../internal/motionHumanBody";
import { motionPickUpSeated } from "../internal/motionPickUpSeated";

/**
 * Seated pick-up keeps its seat, feet and hand motion within the authored verdicts.
 *
 * Scenarios:
 * 1. A glass beyond the seated arm by itself is reached by a forward lean. The seat and feet keep their contacts.
 * 2. The same performed pick-up supplies the complete continuous verdicts, including digit continuity and clearance.
 * 3. A glass twice the arm length away refuses on the prop axis and names standing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the real pick-up branch, decisive event and refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the real seated pick-up once on each body and shares it between the original kinematic and whole-interval verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The fixture sets the glass from the displayed seated shoulder and the arm and grip lengths. It preserves both actors' exit poses and original seat, sole and audit limits.
 * @evidence contracts/development/testing.md#distinguishing-cases The small woman's reach and the average man's reach on their own normalized stages preserve both limiting geometries.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario instantiates the actors and archetypes in memory and gathers all reports before the final assertion.
 */
export function test_human_motion_pick_up_seated(): void {
  const complaints: string[] = [];
  for (const name of BODIES) motionPickUpSeated(name, complaints);
  TestValidator.equals("Seated pick-up keeps its seat, feet and hand motion within the authored verdicts", complaints, []);
}

/** Bodies of different proportions in the original observed stages. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-average"];
