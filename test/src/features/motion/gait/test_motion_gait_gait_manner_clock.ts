import { AutoMovieMotionHumanGait, HumanCue } from "@automovie/motions";
import {
  AutoMovieMotionClock,
  AutoMovieMotionManner,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A regular beat fixes step cadence while movement and hold intervals can be
 * retimed independently.
 *
 * Scenarios:
 *
 * 1. A ninety-beat-per-minute score starts at its supplied second and has a
 *    two-thirds-second step period.
 * 2. Apply different tempo and hold factors to a movement, a pause and a fixed
 *    recovery.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the seconds-per-beat conversion and each span's owner.
 * @evidence contracts/development/testing.md#behavioral-verification Reads real cue times, the public cadence estimator and the manner-adjusted clock.
 * @evidence contracts/development/testing.md#independent-expectations Sixty seconds divided by beats per minute gives the period. Each authored interval is multiplied by its own stated factor.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a shifted cue track, regular beat intervals and timed, held and fixed spans.
 * @evidence contracts/development/testing.md#execution-ownership Exercises pure clock operations without a body or scheduled crowd.
 */
export function test_motion_gait_gait_manner_clock(): void {
  const bpm: number = 90;
  const start: number = 1;
  const beats = HumanCue.beats({ bpm, count: 4, from: start })
    .filter((cue) => cue.name === "beat")
    .map((beat) => beat.seconds);
  for (const [i, time] of beats.entries())
    TestValidator.predicate(
      "beat " + i,
      nclose(time, start + (i * 60) / bpm, 1e-12),
    );
  TestValidator.predicate(
    "step period",
    nclose(AutoMovieMotionHumanGait.walkCadence.period(beats), 60 / bpm, 1e-12),
  );
  const base = AutoMovieMotionClock(6, [
    { name: "move", seconds: 0 },
    { name: "hold", seconds: 2 },
    { name: "recover", seconds: 4 },
  ]);
  const manner = AutoMovieMotionManner.time(
    base,
    { tempo: 0.5, hold: 2 },
    { holds: ["hold"], fixed: ["recover"] },
  );
  TestValidator.equals(
    "separate movement, hold and recovery durations",
    [manner.at("hold"), manner.at("recover"), manner.duration],
    [1, 5, 7],
  );
}
