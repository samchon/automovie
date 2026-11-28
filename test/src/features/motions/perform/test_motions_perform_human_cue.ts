import { AutoMovieEngineScheduleWalk } from "@automovie/engine";
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
 * 5. Fractional tempo is valid. Count and meter must be positive safe integers.
 * 6. Invalid seconds and tracks that exceed array capacity refuse before emission.
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

  const shifted: IAutoMovieScheduleCue[] = AutoMovieMotionHumanCue.beats({
    bpm: 7.5,
    count: 3,
    from: -1,
    meter: 2,
  });
  TestValidator.equals(
    "a finite fractional tempo keeps phase and cue order",
    shifted,
    [
      { name: "downbeat", seconds: -1 },
      { name: "beat", seconds: -1 },
      { name: "beat", seconds: 7 },
      { name: "downbeat", seconds: 15 },
      { name: "beat", seconds: 15 },
    ],
  );
  TestValidator.equals(
    "indexed beat and downbeat readers consume the emitted track",
    [
      AutoMovieEngineScheduleWalk.instant("pulse", shifted, "beat", 1, undefined),
      AutoMovieEngineScheduleWalk.instant("pulse", shifted, "downbeat", 1, undefined),
    ],
    [7, 15],
  );
  TestValidator.equals(
    "a single beat needs no representable inter-beat interval",
    AutoMovieMotionHumanCue.beats({ bpm: Number.MIN_VALUE, count: 1, from: 3 }),
    [
      { name: "downbeat", seconds: 3 },
      { name: "beat", seconds: 3 },
    ],
  );
  for (const [input, field] of [
    [{ bpm: Infinity, count: 3 }, "tempo"],
    [{ bpm: NaN, count: 3 }, "tempo"],
    [{ bpm: 60, count: 1.5 }, "count"],
    [{ bpm: 60, count: 3, meter: 2.5 }, "meter"],
    [{ bpm: 60, count: Infinity }, "count"],
    [{ bpm: 60, count: 3, meter: Infinity }, "meter"],
    [{ bpm: 60, count: 2 ** 32 - 1, meter: Number.MAX_SAFE_INTEGER }, "array capacity"],
    [{ bpm: 60, count: 3, from: NaN }, "first second"],
    [{ bpm: Number.MIN_VALUE, count: 2 }, "last second"],
  ] as const)
    TestValidator.predicate(
      `the beat track refuses invalid ${field}`,
      throwsError(() => AutoMovieMotionHumanCue.beats(input), field),
    );
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

/**
 * Cue constructors produce ordered recurring beats, section arrivals, commands,
 * clock instants and dialogue accents. The scenarios also exercise malformed
 * timings, invalid beat domains, and indexed consumption of a generated track.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Timed beat, wave, command, clock, and dialogue tracks exercise both ordered output and malformed declarations.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the cue owners with explicit tempos, sections, orders, instants and dialogue. The test reads an emitted beat track by both beat and downbeat index, checks rejects for invalid timing, count, meter and capacity, and compares complete cue order.
 * @evidence contracts/development/testing.md#independent-expectations At 90 BPM beats are 2/3 s apart. At 7.5 BPM the interval is 8 s, so starting at -1 s gives beat index 1 at 7 s and downbeat index 1 at 15 s for meter 2. A capacity of 2^32-1 cannot hold that many beats plus one downbeat. The authored wave reaches sections at 2, 3.5 and 7 s.
 */
export function test_motions_perform_human_cue(): void {
  scenario_test_motions_perform_human_cue_beats();
  scenario_test_motions_perform_human_cue_tracks();
}
