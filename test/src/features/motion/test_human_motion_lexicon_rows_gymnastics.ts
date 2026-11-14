import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";

/**
 * Every row of the `gymnastics` family of the lexicon is something a body can
 * do: on the average man and on the small woman, alone, it is accepted and
 * planned, in its own name.
 *
 * A row writes no motion; it fixes parameters of an action that already
 * fits a body. Its first possible fault is a fixed combination that action
 * refuses on some body, and this test is the net for that. The vault and the
 * pole vault need a prop, a held pole and a run, which their group tests
 * stage; what a planned row looks like is those tests'.
 *
 * Scenarios, for each of the two bodies:
 * 1. Each row performed alone, with what it leaves open given by the net's
 *    table (a bar and a landing place for the flop), plans, and the placed
 *    action carries the row's name.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the rows through the public input and builds a performance of each on real bodies; a row that is refused, or placed under another name, fails with the row, the body and the refusal's own message.
 * @evidence contracts/development/testing.md#independent-expectations That each row is humanly performable from standing is what the row claims; nothing is compared with a value read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases The family's rows on two bodies of opposite build; a family that holds no row fails.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per row and body; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what the net catches, what it leaves to the group tests, and the 1 scenario.
 */
export function test_human_motion_lexicon_rows_gymnastics(): void {
  TestValidator.equals(
    "every row is performable",
    LexiconRowNet.rows("gymnastics"),
    [],
  );
}
