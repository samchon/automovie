import type { IAutoMovieScheduleCue } from "@automovie/interface";
import { HumanCue } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** Rounding of one product, one quotient and one sum, seconds. */
const ROUNDING: number = 1e-12;

/**
 * `HumanCue.beats` writes a beat track: a `beat` every 60 / BPM seconds from
 * the first beat, and a `downbeat` at the first beat of every bar of `meter`
 * beats, listed before the beat it shares a second with.
 *
 * Scenarios:
 *
 * 1. Five beats at 90 BPM from 1 s in 4/4: beats at 1 + 2i/3 s, downbeats on the
 *    first and the fifth.
 * 2. Without `from` and `meter` the track starts at 0 s in four.
 * 3. A meter of one makes every beat a downbeat.
 * 4. A single beat is one downbeat and one beat at the first second.
 * 5. A tempo, a count or a meter of 0 is refused. Whether a count is whole is the
 *    caller's: the function admits only its sign.
 */
export function test_unit_motions_perform_human_cue_beats(): void {
  const matches: (
    track: readonly IAutoMovieScheduleCue[],
    expected: readonly IAutoMovieScheduleCue[],
  ) => boolean = (
    track: readonly IAutoMovieScheduleCue[],
    expected: readonly IAutoMovieScheduleCue[],
  ): boolean =>
    track.length === expected.length &&
    track.every(
      (cue: IAutoMovieScheduleCue, i: number): boolean =>
        cue.name === expected[i]!.name &&
        nclose(cue.seconds, expected[i]!.seconds, ROUNDING),
    );

  // 1. 90 BPM from 1 s.
  const step: number = 60 / 90;
  TestValidator.predicate(
    "five beats at 90 BPM in four",
    matches(HumanCue.beats({ bpm: 90, count: 5, from: 1, meter: 4 }), [
      { name: "downbeat", seconds: 1 },
      { name: "beat", seconds: 1 },
      { name: "beat", seconds: 1 + step },
      { name: "beat", seconds: 1 + 2 * step },
      { name: "beat", seconds: 1 + 3 * step },
      { name: "downbeat", seconds: 1 + 4 * step },
      { name: "beat", seconds: 1 + 4 * step },
    ]),
  );

  // 2. The defaults.
  TestValidator.predicate(
    "from 0 s in four by default",
    matches(HumanCue.beats({ bpm: 120, count: 5 }), [
      { name: "downbeat", seconds: 0 },
      { name: "beat", seconds: 0 },
      { name: "beat", seconds: 0.5 },
      { name: "beat", seconds: 1 },
      { name: "beat", seconds: 1.5 },
      { name: "downbeat", seconds: 2 },
      { name: "beat", seconds: 2 },
    ]),
  );

  // 3. Every beat a downbeat.
  TestValidator.predicate(
    "a meter of one",
    matches(HumanCue.beats({ bpm: 60, count: 2, meter: 1 }), [
      { name: "downbeat", seconds: 0 },
      { name: "beat", seconds: 0 },
      { name: "downbeat", seconds: 1 },
      { name: "beat", seconds: 1 },
    ]),
  );

  // 4. A single beat.
  TestValidator.predicate(
    "a single beat",
    matches(HumanCue.beats({ bpm: 100, count: 1, from: 2 }), [
      { name: "downbeat", seconds: 2 },
      { name: "beat", seconds: 2 },
    ]),
  );

  // 5. Refusals.
  for (const [label, task] of [
    ["a tempo of 0", () => HumanCue.beats({ bpm: 0, count: 4 })],
    ["a count of 0", () => HumanCue.beats({ bpm: 90, count: 0 })],
    ["a meter of 0", () => HumanCue.beats({ bpm: 90, count: 4, meter: 0 })],
  ] as const)
    TestValidator.predicate(`${label} is refused`, throwsError(task));
}
