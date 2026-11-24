import {
  AutoMovieComposition,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieIntentTiming,
  IAutoMovieMotionHumanCue,
  IAutoMovieSchedule,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";
import { HumanCue } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../features/internal/nclose";
import { throwsError } from "../../../features/internal/throwsError";

/**
 * Each section responds at its own indexed cue, in film seconds.
 *
 * Scenarios:
 * 1. A wave starts at 2 s and travels at 2 m/s. Sections at 0, 3 and 10 m
 *    start at 2, 3.5 and 7 s through the ordinary schedule resolver.
 * 2. Shifting the origin and scaling distances with speed preserves delays.
 *    Authored times or coincident marks cue distinct sections together.
 * 3. Reject empty, nonfinite, negative or descending values, an invalid
 *    speed or origin, overlapping input modes, and propagation that
 *    overflows or rounds back to the previous film second.
 * 4. Admit a positive delay that rounds upward to a distinct finite second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the timing rule, the fixture values and the refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public cue producer and resolver and checks each resolved section's start by subject.
 * @evidence contracts/development/testing.md#independent-expectations The example uses hand-computed arrivals and separately authored seconds. Distance divided by speed is invariant to a common scale, and adding to the origin shifts all film times equally. At 2^53, a half-second advance rounds back to the origin, but at 2^53 minus one it rounds up to 2^53.
 * @evidence contracts/development/testing.md#distinguishing-cases Uneven distances separate travel time from a fixed index interval. An authored tie distinguishes intentional unison from indistinguishable propagated arrivals.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory test of public scheduling with fixed one-second actions and no host dependencies.
 */
export function test_motion_gesture_section_wave(): void {
  const composition: IAutoMovieComposition = AutoMovieComposition.parallel(
    AutoMovieComposition.at(
      "audience",
      { subject: "left", capability: "respond" },
      0,
      { event: "section", index: 0 },
    ),
    AutoMovieComposition.at(
      "audience",
      { subject: "middle", capability: "respond" },
      0,
      { event: "section", index: 1 },
    ),
    AutoMovieComposition.at(
      "audience",
      { subject: "right", capability: "respond" },
      0,
      { event: "section", index: 2 },
    ),
  );
  const starts = (cues: IAutoMovieScheduleCue[]): number[] => {
    const schedule: IAutoMovieSchedule = resolveAutoMovieSchedule(composition, {
      cues: { audience: cues },
      timing: (): IAutoMovieIntentTiming => ({ duration: 1 }),
    });
    return ["left", "middle", "right"].map(
      (subject: string): number =>
        schedule.entries.find(
          (entry: IAutoMovieScheduleEntry): boolean =>
            entry.intent.subject === subject,
        )?.start ?? NaN,
    );
  };

  const arrived: number[] = starts(
    HumanCue.sectionWave({ distances: [0, 3, 10], from: 2, speed: 2 }),
  );
  TestValidator.predicate(
    "uneven sections arrive at 2, 3.5 and 7 film seconds",
    nclose(arrived[0]!, 2) &&
      nclose(arrived[1]!, 3.5) &&
      nclose(arrived[2]!, 7),
  );

  const retimed: number[] = starts(
    HumanCue.sectionWave({ distances: [0, 6, 20], from: 5, speed: 4 }),
  );
  for (const [index, seconds] of retimed.entries())
    TestValidator.predicate(
      `section ${index} keeps its propagation delay under affine retiming`,
      nclose(seconds - arrived[index]!, 3),
    );

  const coincident: number[] = starts(
    HumanCue.sectionWave({ distances: [0, 3, 3], from: 2, speed: 2 }),
  );
  TestValidator.predicate(
    "sections at the same path mark retain both cue indices",
    nclose(coincident[0]!, 2, 0) &&
      nclose(coincident[1]!, 3.5, 0) &&
      nclose(coincident[2]!, 3.5, 0),
  );

  const authored: number[] = starts(
    HumanCue.sectionWave({ seconds: [2, 2.75, 2.75] }),
  );
  TestValidator.predicate(
    "authored sections may respond together",
    nclose(authored[0]!, 2) &&
      nclose(authored[1]!, 2.75) &&
      nclose(authored[2]!, 2.75),
  );

  const invalid: readonly [IAutoMovieMotionHumanCue.ISectionWave, string][] = [
    [{ seconds: [] }, "at least one section"],
    [{ seconds: [1, NaN] }, "Section 1"],
    [{ seconds: [-1] }, "Section 0"],
    [{ seconds: [3, 2] }, "out of order"],
    [{ distances: [3, 1], from: 1, speed: 2 }, "out of order"],
    [{ distances: [0], from: 1, speed: Infinity }, "positive speed"],
    [{ distances: [0], from: 1, speed: 0 }, "positive speed"],
    [{ distances: [0], from: -1, speed: 2 }, "origin second"],
  ];
  for (const [wave, message] of invalid)
    TestValidator.predicate(
      `refuses a malformed section wave with ${message}`,
      throwsError(
        (): IAutoMovieScheduleCue[] => HumanCue.sectionWave(wave),
        message,
      ),
    );

  TestValidator.predicate(
    "a delay that overflows is refused at the second section",
    throwsError(
      (): IAutoMovieScheduleCue[] =>
        HumanCue.sectionWave({
          distances: [0, Number.MAX_VALUE],
          from: 1,
          speed: 0.5,
        }),
      ["Section 1", "advancing film second"],
    ),
  );
  const boundary: number = 2 ** 53;
  TestValidator.predicate(
    "a half-second delay rounded back to the origin is refused",
    throwsError(
      (): IAutoMovieScheduleCue[] =>
        HumanCue.sectionWave({ distances: [0, 1], from: boundary, speed: 2 }),
      ["Section 1", "advancing film second"],
    ),
  );
  const advanced: IAutoMovieScheduleCue[] = HumanCue.sectionWave({
    distances: [0, 1],
    from: boundary - 1,
    speed: 2,
  });
  TestValidator.predicate(
    "a half-second delay rounded up to a distinct second is admitted",
    nclose(advanced[0]!.seconds, boundary - 1, 0) &&
      nclose(advanced[1]!.seconds, boundary, 0),
  );

  const conflicting = {
    seconds: [2],
    distances: [0],
    from: 2,
    speed: 2,
  } satisfies Record<string, number | number[]>;
  TestValidator.predicate(
    "refuses competing timing sources supplied at runtime",
    throwsError(
      (): unknown =>
        Reflect.apply(HumanCue.sectionWave, undefined, [conflicting]),
      "exactly one timing source",
    ),
  );
}
