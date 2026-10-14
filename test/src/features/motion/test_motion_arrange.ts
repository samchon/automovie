import { arrangeMotion, holdMotion } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieJointPose, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";

import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

const spine: (m: IAutoMoviePose) => IAutoMovieJointPose | undefined = (m: IAutoMoviePose): IAutoMovieJointPose | undefined =>
  m.joints.find((x: IAutoMovieJointPose): boolean => x.bone === "spine");

/**
 * `holdMotion` + `arrangeMotion`: the harness PERFORMANCE composer.
 *
 * Scenarios:
 *
 * 1. `holdMotion` is a two-keyframe clip holding one pose for the duration, with
 *    the skeleton id stamped on.
 * 2. `arrangeMotion([])` is an empty, zero-length clip (skeleton id "").
 * 3. Two clips with a gap: each is shifted to its start, and the first clip's
 *    final pose is held at the next clip's start (times 0,1,2,3; the t=2 frame
 *    holds clip A's end pose). The dropped coincident frame keeps times
 *    strictly increasing.
 * 4. Contiguous clips (no gap) just concatenate; the seam's duplicate time is
 *    dropped. Input order does not matter (placements are sorted by start).
 * 5. Invalid hold/placement durations, starts and empty clip keyframes refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes holdMotion and arrangeMotion and checks pose values, clock populations, gap-tail holding, seam dropping, clip identity and named malformed-timeline refusals. Retiming the wrong clip, omitting a gap hold or emitting an incomplete clock fails these observations.
 * @evidence contracts/testing.md#independent-expectations Two one-second clips at starts zero/two give times [0,1,2,3] with the prior 30-degree tail at two; contiguous starts zero/one give [0,1,2]. The literal times/poses and finite-positive scalar requirements are independent of emitted output; this entry does not sample interpolation or prove nested pose ownership.
 * @evidence contracts/testing.md#distinguishing-cases Keeps a held pose, empty arrangement, shuffled gapped placements, contiguous seam and original nonfinite/zero/negative duration, nonfinite/negative start and empty-keyframe refusals. Overlapping placements and gait-clock propagation belong to their own composer entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns all local composer cases and uses existing pose/motion fixtures with portable source, without installing a consumer, building a native artifact, starting a process/browser/GPU or dynamically registering tests.
 */
export function test_motion_arrange(): void {
  // 1. holdMotion
  const held: IAutoMovieMotion = holdMotion(
    "h",
    "skeleton-1",
    makePose([joint("spine", { flexion: 12 })]),
    2,
  );
  TestValidator.equals("hold has two keyframes", held.keyframes.length, 2);
  TestValidator.predicate("hold spans the duration", nclose(held.duration, 2));
  TestValidator.equals(
    "hold carries the skeleton",
    held.skeleton,
    "skeleton-1",
  );
  TestValidator.equals(
    "both frames hold the same pose",
    namedFacts([
      [
        "ncloseSpineHeld",
        (): boolean => nclose(spine(held.keyframes[0]!.pose)!.flexion!, 12),
      ],
      [
        "ncloseSpineHeld2",
        (): boolean => nclose(spine(held.keyframes[1]!.pose)!.flexion!, 12),
      ],
    ]),
    { ncloseSpineHeld: true, ncloseSpineHeld2: true },
  );

  // 2. empty
  const empty: IAutoMovieMotion = arrangeMotion("e", []);
  TestValidator.equals("empty has no keyframes", empty.keyframes.length, 0);
  TestValidator.predicate("empty is zero-length", nclose(empty.duration, 0));
  TestValidator.equals("empty skeleton falls back to ''", empty.skeleton, "");

  // 3. two clips with a gap → hold across it (input order shuffled)
  const A: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("spine", { flexion: 0 })])),
      keyframe(1, makePose([joint("spine", { flexion: 30 })])),
    ],
    1,
  );
  const B: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("spine", { flexion: 0 })])),
      keyframe(1, makePose([joint("spine", { flexion: -20 })])),
    ],
    1,
  );
  const gapped: IAutoMovieMotion = arrangeMotion("g", [
    { start: 2, motion: B },
    { start: 0, motion: A },
  ]);
  TestValidator.predicate(
    "times are 0,1,2,3 (gap held, seam dropped)",
    gapped.keyframes.length === 4 && gapped.keyframes
      .map((k: IAutoMovieKeyframe): number => k.time)
      .every((t: number, i: number): boolean => nclose(t, [0, 1, 2, 3][i]!)),
  );
  TestValidator.predicate(
    "duration is the last placement end",
    nclose(gapped.duration, 3),
  );
  TestValidator.predicate(
    "t=2 holds clip A's end pose",
    nclose(spine(gapped.keyframes[2]!.pose)!.flexion!, 30),
  );
  TestValidator.equals(
    "skeleton from the first placement",
    gapped.skeleton,
    "skeleton-1",
  );

  // 4. contiguous → concatenate, seam dropped, no hold inserted
  const back2back: IAutoMovieMotion = arrangeMotion("c", [
    { start: 0, motion: A },
    { start: 1, motion: B },
  ]);
  TestValidator.predicate(
    "contiguous times 0,1,2",
    back2back.keyframes.length === 3 && back2back.keyframes
      .map((k: IAutoMovieKeyframe): number => k.time)
      .every((t: number, i: number): boolean => nclose(t, [0, 1, 2][i]!)),
  );
  TestValidator.predicate(
    "contiguous duration 2",
    nclose(back2back.duration, 2),
  );
  // 5. invalid timeline scalars reject before emitting malformed keyframes
  for (const duration of [Number.NaN, 0, -1])
    TestValidator.predicate(
      `hold rejects invalid duration ${duration}`,
      throwsError(
        (): IAutoMovieMotion => holdMotion("badHold", "skeleton-1", makePose([]), duration),
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
        (): IAutoMovieMotion => arrangeMotion("badArrange", [{ start, motion: A }]),
        message,
      ),
    );

  TestValidator.predicate(
    "arrange rejects empty placement keyframes",
    throwsError(
      (): IAutoMovieMotion =>
        arrangeMotion("badArrange", [{ start: 0, motion: makeMotion([], 1) }]),
      'motion placement "motion-1" must have keyframes',
    ),
  );

  for (const duration of [Number.NaN, 0, -1])
    TestValidator.predicate(
      `arrange rejects invalid placement duration ${duration}`,
      throwsError(
        (): IAutoMovieMotion =>
          arrangeMotion("badArrange", [
            { start: 0, motion: { ...A, duration } },
          ]),
        'motion placement "motion-1" duration must be finite and positive',
      ),
    );
}
