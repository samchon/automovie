import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";

/**
 * Plans the rhythmic arm form on the average body.
 *
 * Scenarios:
 * 1. The public chain places the registered row under its own name.
 * 2. The placed timeline spans a positive duration on the staged body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names this performer and the two placement checks.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the registered row on the original staged body and inspects the public segment. A refusal, swapped row or empty active duration fails.
 * @evidence contracts/development/testing.md#independent-expectations The authored row is performable and has a nonempty placement under its declared name.
 * @evidence contracts/development/testing.md#distinguishing-cases This body's anthropometry determines its reach and clearances. The other bodies retain their own specs.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory performance and one segment read, without a host.
 */
export function test_human_motion_lexicon_rows_sport_form_average(): void {
  TestValidator.equals(
    "the registered plan covers the rhythmic arm form on the average body",
    LexiconRowNet.rows("sport", ["karatePunches"], false, "m-average"),
    [],
  );
}
