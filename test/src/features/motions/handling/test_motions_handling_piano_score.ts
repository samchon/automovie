import type { IAutoMovieMotionHumanPianoScore } from "@automovie/interface";
import {
  pianoScoreEvents
} from "../../../../../packages/motions/src/handling/internal/pianoScoreEvents";
import { TestValidator } from "@nestia/e2e";

/**
 * `pianoScore`'s own logic, its events (`pianoScoreEvents`): each scored key is
 * down at its `at` and up at its `to`, numbered in score order, as shares of
 * the score's duration, all sorted by share.
 *
 * Scenario, a 2 s score of two notes in score order, the second struck while
 * the first is still down (`key45` down at 0.5 s and up at 1.5 s, `key47` down
 * at 1 s and up at 1.2 s): the events run `keyDown1` at 0.25, `keyDown2` at
 * 0.5, `keyUp2` at 0.6 and `keyUp1` at 0.75.
 */
export function test_motions_handling_piano_score(): void {
  const note = (
    key: string,
    at: number,
    to: number,
  ): IAutoMovieMotionHumanPianoScore.INote => ({
    key,
    hand: "right",
    digit: "index",
    from: at - 0.2,
    at,
    release: to - 0.1,
    to,
  });
  TestValidator.equals(
    "the events",
    pianoScoreEvents([note("key45", 0.5, 1.5), note("key47", 1, 1.2)], 2),
    [
      { name: "keyDown1", share: 0.25 },
      { name: "keyDown2", share: 0.5 },
      { name: "keyUp2", share: 0.6 },
      { name: "keyUp1", share: 0.75 },
    ],
  );
}
