import type { IAutoMovieScheduleCue } from "@automovie/interface";
import { AutoMovieMotionHumanCue } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of one product, one quotient and one sum, seconds. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanCue.beats` writes a beat track: a `beat` every 60 / BPM seconds from
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
function scenario_test_motions_perform_human_cue_beats(): void {
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
    matches(AutoMovieMotionHumanCue.beats({ bpm: 90, count: 5, from: 1, meter: 4 }), [
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
    matches(AutoMovieMotionHumanCue.beats({ bpm: 120, count: 5 }), [
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
    matches(AutoMovieMotionHumanCue.beats({ bpm: 60, count: 2, meter: 1 }), [
      { name: "downbeat", seconds: 0 },
      { name: "beat", seconds: 0 },
      { name: "downbeat", seconds: 1 },
      { name: "beat", seconds: 1 },
    ]),
  );

  // 4. A single beat.
  TestValidator.predicate(
    "a single beat",
    matches(AutoMovieMotionHumanCue.beats({ bpm: 100, count: 1, from: 2 }), [
      { name: "downbeat", seconds: 2 },
      { name: "beat", seconds: 2 },
    ]),
  );

  // 5. Refusals.
  for (const [label, task] of [
    ["a tempo of 0", () => AutoMovieMotionHumanCue.beats({ bpm: 0, count: 4 })],
    ["a count of 0", () => AutoMovieMotionHumanCue.beats({ bpm: 90, count: 0 })],
    ["a meter of 0", () => AutoMovieMotionHumanCue.beats({ bpm: 90, count: 4, meter: 0 })],
  ] as const)
    TestValidator.predicate(`${label} is refused`, throwsError(task));
}

/** The cues' names and seconds, in order. */
const listed = (cues: readonly IAutoMovieScheduleCue[]): string =>
  cues
    .map((cue: IAutoMovieScheduleCue): string => `${cue.name}@${cue.seconds}`)
    .join(" ");

/**
 * `HumanCue` writes cue tracks: a section wave's cue per section, a drill's
 * preparatory and executive words, a clock's named instants and a line's start,
 * accents, phrase ends and end, each in film seconds.
 *
 * Scenarios:
 *
 * 1. A wave from 2 s at 2 m/s cues sections at 0, 3 and 10 m at 2, 3.5 and 7 s;
 *    authored seconds are kept as they are; a section out of order is refused.
 * 2. Two orders at 3 s and 1 s, the first with a 1 s caution, sort into `halt` at
 *    1 s, `marchCaution` at 2 s and `march` at 3 s; a caution at or before the
 *    word before is refused.
 * 3. A clock's instants, one at a time named, are kept in time order, ties in
 *    their own order.
 * 4. A line from 1 to 3 s with an accent at 2 s and a phrase end at 2.5 s cues
 *    them between its start and its end; an accent outside it is refused.
 */
function scenario_test_motions_perform_human_cue_tracks(): void {
  TestValidator.equals(
    "a travelling wave",
    listed(AutoMovieMotionHumanCue.sectionWave({ distances: [0, 3, 10], from: 2, speed: 2 })),
    "section@2 section@3.5 section@7",
  );
  TestValidator.equals(
    "authored seconds",
    listed(AutoMovieMotionHumanCue.sectionWave({ seconds: [1, 1, 4] })),
    "section@1 section@1 section@4",
  );
  TestValidator.error("out of order", () =>
    AutoMovieMotionHumanCue.sectionWave({ seconds: [2, 1] }),
  );

  TestValidator.equals(
    "orders",
    listed(
      AutoMovieMotionHumanCue.orders([
        { word: "march", at: 3, caution: 1 },
        { word: "halt", at: 1 },
      ]),
    ),
    "halt@1 marchCaution@2 march@3",
  );
  TestValidator.error("a caution over the word before", () =>
    AutoMovieMotionHumanCue.orders([
      { word: "march", at: 3, caution: 2.5 },
      { word: "halt", at: 1 },
    ]),
  );

  TestValidator.equals(
    "instants",
    listed(
      AutoMovieMotionHumanCue.instants(
        {
          instants: [
            { label: "b", seconds: 2 },
            { label: "a", seconds: 1 },
            { label: "c", seconds: 2 },
            { label: "skip", seconds: 0 },
          ],
        },
        ["a", "b", "c"],
      ),
    ),
    "a@1 b@2 c@2",
  );

  TestValidator.equals(
    "a line",
    listed(
      AutoMovieMotionHumanCue.dialogue([{ from: 1, to: 3, accents: [2], phrases: [2.5] }]),
    ),
    "lineStart@1 accent@2 phraseEnd@2.5 lineEnd@3",
  );
  TestValidator.error("an accent outside", () =>
    AutoMovieMotionHumanCue.dialogue([{ from: 1, to: 3, accents: [4] }]),
  );
}

/** HumanCue, the cue beats and tracks a performance reads, each scenario below. */
export function test_motions_perform_human_cue(): void {
  scenario_test_motions_perform_human_cue_beats();
  scenario_test_motions_perform_human_cue_tracks();
}
