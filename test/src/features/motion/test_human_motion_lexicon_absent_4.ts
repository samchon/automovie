import { TestValidator } from "@nestia/e2e";

import { LexiconAbsentNet } from "../internal/LexiconAbsentNet";

/**
 * Part 4 of 8 of the lexicon's rows, each left without what an author may
 * leave out or get wrong, plans or refuses as the grammar does: never a
 * program's failure (a `TypeError`, a `RangeError`, a stack overflow),
 * and never a refusal that names `undefined` for what was not given.
 *
 * Scenarios, on the average man, for each row whose position in the
 * lexicon leaves 3 when divided by 8:
 * 1. The row has an entry in `HUMAN_LEXICON_SCHEMAS`, which its parameters
 *    are checked against at its entry.
 * 2. Planned alone after a short stand with no parameters.
 * 3. When the lexicon's net gives the row a region, planned in that net's
 *    scene with every region replaced by one no body has (`chest`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each row through the public input and reads what the build throws; a JavaScript error, or a refusal without its axis or naming `undefined`, fails with the row and the message.
 * @evidence contracts/development/testing.md#independent-expectations That a missing or a wrong value is refused by the grammar, never crashes, is the grammar's own contract for any row; nothing is read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases Every row of the part, with no parameters and with a region no body has; the parts together cover the whole lexicon.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one or two short performances per row; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the part and the 3 scenarios.
 */
export function test_human_motion_lexicon_absent_4(): void {
  TestValidator.equals(
    "every row plans or refuses as the grammar does",
    LexiconAbsentNet.cast([3, 8]),
    [],
  );
}