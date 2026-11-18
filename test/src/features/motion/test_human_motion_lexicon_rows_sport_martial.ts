import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";

/**
 * The lexicon registers a static martial stance on the three staged bodies.
 *
 * Scenarios:
 * 1. Each row plans under its own name with the parameters that branch needs.
 * 2. A row with a partner plans with each performer and partner assignment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names this group's construction boundary and the body and scene variations it exercises.
 * @evidence contracts/development/testing.md#behavioral-verification Places the actual registered law under its authored name on the public chain. A refused or misnamed placement fails the case with the exact row and performer.
 * @evidence contracts/development/testing.md#independent-expectations A registered row must accept the authored fixture and appear under the name the chain asked to place.
 * @evidence contracts/development/testing.md#distinguishing-cases Retains the rows and body pairings of this group. Dedicated law tests own displayed geometry and physical bounds.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable test builds in-memory performances on prepared bodies. Each row owns only the registration it uses.
 */
export function test_human_motion_lexicon_rows_sport_martial(): void {
  TestValidator.equals(
    "the static stance plans on the staged bodies",
    LexiconRowNet.rows("sport", ["horseStance"]),
    [],
  );
}
