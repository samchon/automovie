import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";

/**
 * Every row of part 2 of 2 of the `sportGym` family of the lexicon (the rows whose position in the family leaves 1 when divided by 2) is something a body can
 * do: on the average man and on the small woman, alone or on a partner of
 * the other build, it is accepted and planned, in its own name.
 *
 * A row writes no motion; it fixes parameters of an action that already
 * fits a body. Its first possible fault is a fixed combination that action
 * refuses on some body or at a natural distance, and this test is the net
 * for that. Whether a planned row keeps the physical bounds is the verdict
 * net's, and what a row should look like its own signature test's. The family is cast in 2 parts so each test stays under a minute.
 *
 * Scenarios, for each performer of the two bodies:
 * 1. Each row performed alone, with what it leaves open given by the net's
 *    table (a place to go, a bench, a ball), plans, and the placed action
 *    carries the row's name.
 * 2. Each row performed on a partner at its own distance plans; a costly
 *    strike is planned by one of the two performers.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the rows through the public input and builds a performance of each on real bodies; a row that is refused, or placed under another name, fails with the row, the body and the refusal's own message.
 * @evidence contracts/development/testing.md#independent-expectations That each row is humanly performable at these distances is what the row claims; nothing is compared with a value read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases The family's rows, alone and on a partner, with the performer and the partner of opposite builds; a family that holds no row fails.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per row and body; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what the net catches, what it leaves to the verdict net and to signature tests, and the 2 scenarios.
 */
export function test_human_motion_lexicon_rows_sport_gym_2(): void {
  TestValidator.equals("every row is performable", LexiconRowNet.rows("sportGym", [1, 2]), []);
}
