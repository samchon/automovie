import { motionSportRows } from "../internal/motionSportRows";

/**
 * Every kind of the sport, exercise, stretch and dance actions, and every
 * row of `HumanSport`, is something a body can do at every proficiency:
 * on m-large at novice it is accepted and planned out of quiet standing,
 * by the action's own method and by the row that names it for a screenplay.
 * `motionSportRows` states the 2 scenarios.
 *
 * This is part 8 of 13 of the net on m-large at novice: the checks whose position in the net leaves 7 when divided by 13; the 13 parts together are the whole net. Written by `pnpm --filter @automovie/test sweep:parts sportRows`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance of every kind and row of the part through the public chain and input on a real body; a kind that is refused, plans no time, or a row placed under another name fails with the kind, the body, the proficiency and the refusal's message.
 * @evidence contracts/development/testing.md#independent-expectations That each kind is humanly performable out of standing at any proficiency is what the vocabulary claims; nothing is compared with a value read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases The smallest and the largest body at the two ends of proficiency, each a spec of parts; the trained nets are `test_human_motion_sport_rows_f_small` and `_m_average`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds this part's short performances, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States what the net catches, the part's share of it and where the scenarios are stated.
 */
export function test_human_motion_sport_rows_m_large_novice_08(): void {
  motionSportRows.run("m-large", "novice", [7, 13]);
}
