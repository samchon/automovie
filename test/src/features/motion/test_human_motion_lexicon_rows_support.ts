import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";

/**
 * Every row of the `support` family of the lexicon (`HumanSupportRows`:
 * the box vault, the scramble and the slide off an edge) is something a body
 * can do: on the average man and on the small woman, alone or beside a
 * partner of the other build, it is accepted and planned, in its own name.
 *
 * A row writes no motion; it fixes the stances of the support planner, and
 * the composition gives the surface (`on`). Its first possible fault is a
 * stance the planner refuses on some body at the net's surface, and this
 * test is the net for that. Whether a planned row keeps the physical bounds
 * is the verdict net's, and the planner's own sequence its own test's
 * (`test_human_motion_support_sequence`).
 *
 * Scenarios, for each performer of the two bodies:
 * 1. Each row performed alone, with its surface given by the net's table,
 *    plans, and the placed action carries the row's name.
 * 2. Each row performed beside a partner plans.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the rows through the public input and builds a performance of each on real bodies; a row that is refused, or placed under another name, fails with the row, the body and the refusal's own message.
 * @evidence contracts/development/testing.md#independent-expectations That each row is humanly performable is what the row claims; nothing is compared with a value read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases The family's rows, alone and beside a partner, on two bodies of opposite build; a family that holds no row fails.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per row and body; it runs wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what the net catches, what it leaves to the verdict net and to the planner's test, and the 2 scenarios.
 */
export function test_human_motion_lexicon_rows_support(): void {
  TestValidator.equals(
    "every row is performable",
    LexiconRowNet.rows("support"),
    [],
  );
}