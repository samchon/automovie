import { arrangeMotion, holdMotion } from "@automovie/engine";
import type { IAutoMovieMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, makePose } from "../../../../features/internal/fixtures";
import { throwsError } from "../../../../features/internal/throwsError";

/**
 * Arrangement sorts absolute placements and holds the departing pose across a gap.
 *
 * Scenarios:
 * 1. Touching and separated holds share an endpoint or extend the departing pose.
 * 2. Empty placement has no timeline. Invalid clocks and empty clips are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Observes times and authored joint values of the returned clip.
 * @evidence contracts/development/testing.md#independent-expectations Placement starts and hold lengths determine the end and shared keys.
 * @evidence contracts/development/testing.md#distinguishing-cases Shuffled input and distinct poses identify which clip owns the gap.
 * @evidence contracts/development/testing.md#execution-ownership Arranges in-memory holds.
 * @evidence contracts/development/common.md#meaningful-documentation States time ownership and admission.
 */
export function test_motion_catalogue_clip_arrangement(): void {
  const first = holdMotion(
    "first",
    "rig",
    makePose([joint("spine", { flexion: 10 })]),
    1,
  );
  const second = holdMotion(
    "second",
    "rig",
    makePose([joint("spine", { flexion: 20 })]),
    1,
  );
  for (const gap of [0, 1]) {
    const start = first.duration + gap;
    const timeline = arrangeMotion("arranged", [
      { start, motion: second },
      { start: 0, motion: first },
    ]);
    const expected = [
      [0, 10],
      [first.duration, 10],
    ];
    if (gap) expected.push([start, 10]);
    expected.push([start + second.duration, 20]);
    TestValidator.equals(
      "times and joint ownership",
      timeline.keyframes.map((key) => [key.time, key.pose.joints[0]!.flexion]),
      expected,
    );
    TestValidator.equals(
      "rig and end",
      [timeline.skeleton, timeline.duration],
      [first.skeleton, start + second.duration],
    );
  }
  const empty = arrangeMotion("empty", []);
  TestValidator.equals(
    "empty layout",
    [empty.skeleton, empty.duration, empty.keyframes.length],
    ["", 0, 0],
  );
  // 5. invalid timeline scalars reject before emitting malformed keyframes
  for (const duration of [Number.NaN, 0, -1])
    TestValidator.predicate(
      `hold rejects invalid duration ${duration}`,
      throwsError(
        (): IAutoMovieMotion =>
          holdMotion("badHold", "skeleton-1", makePose([]), duration),
        "hold duration must be finite and positive",
      ),
    );

  for (const [start, message] of [
    [Number.NaN, "motion placement start must be finite"],
    [-1, "motion placement start must be non-negative"],
  ] as const)
    TestValidator.predicate(
      `arrange rejects invalid start ${start}`,
      throwsError(
        (): IAutoMovieMotion =>
          arrangeMotion("badArrange", [{ start, motion: first }]),
        message,
      ),
    );

  TestValidator.predicate(
    "arrange rejects empty placement keyframes",
    throwsError(
      (): IAutoMovieMotion =>
        arrangeMotion("badArrange", [
          { start: 0, motion: { ...first, keyframes: [] } },
        ]),
      'motion placement "first" must have keyframes',
    ),
  );

  for (const duration of [Number.NaN, 0, -1])
    TestValidator.predicate(
      `arrange rejects invalid placement duration ${duration}`,
      throwsError(
        (): IAutoMovieMotion =>
          arrangeMotion("badArrange", [
            { start: 0, motion: { ...first, duration } },
          ]),
        'motion placement "first" duration must be finite and positive',
      ),
    );
}
