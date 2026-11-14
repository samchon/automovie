import { motionSportRows } from "../internal/motionSportRows";

/**
 * Every kind of the sport, exercise, stretch and dance actions is something
 * a body can do: on the average man it is accepted and planned out of quiet
 * standing, by the action's own method and by the row that names it for a
 * screenplay. `motionSportRows` states the 2 scenarios.
 *
 * A kind's first possible fault is a posture or a reach its law refuses on
 * some body, and this test is the net for that across the ten actions.
 * Whether a planned kind keeps the physical bounds is the verdict net's,
 * and what it should look like its own signature test's.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance of every kind and every row through the public chain and input on a real body; a kind that is refused, plans no time, or a row placed under another name fails with the kind, the body and the refusal's message.
 * @evidence contracts/development/testing.md#independent-expectations That each kind is humanly performable out of standing is what the vocabulary claims; nothing is compared with a value read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases Twenty-nine kinds and every row on the average man; the small woman, the opposite build, is `test_human_motion_sport_rows_f_small`, split so each runs alone in its time.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one short performance per kind and row; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what the net catches, what it leaves to other tests, where the scenarios are stated and the split.
 */
export function test_human_motion_sport_rows_m_average(): void {
  motionSportRows("m-average");
}
