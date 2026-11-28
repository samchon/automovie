import type { IAutoMovieMotionEvent } from "@automovie/interface";
import type {
  IMotionCaptureCase
} from "../../../../../packages/motions/src/executable/internal/IMotionCaptureCase";
import {
  locomotionCaseInstants
} from "../../../../../packages/motions/src/executable/cases/internal/locomotionCaseInstants";
import { TestValidator } from "@nestia/e2e";

/**
 * `locomotionCaseInstants` draws a walk every 0.2 s up to its end, with each
 * heel strike and toe-off of the walker's first segment labelled by its side,
 * and the end, all in time order.
 *
 * The walker `w0`'s segment starts at 1 s and lasts 2 s, with a left heel
 * strike at a quarter, a right toe-off at a half and a `ready` cue.
 *
 * Scenarios:
 *
 * 1. Up to 0.3 s the grid is 0 and 0.2 s; the gait events land at 1.5 s and 2 s
 *    with side-letter captions; other cues are not drawn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines display scheduling of fifth-second ticks, first segment gait events and terminal time.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares a walker with one timed segment, left heel strike, right toe-off and a non-gait cue, then reads selected instants.
 * @evidence contracts/development/testing.md#independent-expectations A 2 s segment starting at 1 puts quarter and half events at 1.5 and 2 s. A short horizon contains only ticks 0 and 0.2, and `ready` is absent.
 */
export function test_motions_executable_locomotion_case_instants(): void {
  const events: IAutoMovieMotionEvent[] = [
    { name: "ready", share: 0.1 },
    { name: "leftHeelStrike", share: 0.25 },
    { name: "rightToeOff", share: 0.5 },
  ];
  const walk: Parameters<typeof locomotionCaseInstants>[0] = {
    segments: (
      subject: string,
    ): ReturnType<Parameters<typeof locomotionCaseInstants>[0]["segments"]> =>
      subject === "w0" ? [{ start: 1, plan: { duration: 2, events } }] : [],
  };
  TestValidator.equals(
    "the grid and the gait events",
    locomotionCaseInstants(walk, 0.3),
    [
      { seconds: 0, label: "0.0 s" },
      { seconds: 0.2, label: "0.2 s" },
      { seconds: 0.3, label: "end" },
      { seconds: 1.5, label: "L HeelStrike" },
      { seconds: 2, label: "R ToeOff" },
    ] satisfies IMotionCaptureCase.ITime[],
  );
}
