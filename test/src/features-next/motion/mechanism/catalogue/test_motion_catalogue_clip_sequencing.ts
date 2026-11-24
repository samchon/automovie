import { sequenceMotion } from "@automovie/engine";
import type { IAutoMovieMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { keyframe, makeMotion, makePose } from "../../../../features/internal/fixtures";
import { throwsError } from "../../../../features/internal/throwsError";

/**
 * A concatenation owns the outgoing pose and incoming easing at a shared instant.
 *
 * Scenarios:
 * 1. Unequal part durations place one shared key and preserve the final key.
 * 2. An empty list, incompatible rig or unusable duration prevents concatenation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the returned keys and public refusals.
 * @evidence contracts/development/testing.md#independent-expectations The sum and seam use the two authored durations.
 * @evidence contracts/development/testing.md#distinguishing-cases Different outgoing and incoming easings disclose seam ownership.
 * @evidence contracts/development/testing.md#execution-ownership Uses two in-memory clips.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the boundary and admission scenarios.
 */
export function test_motion_catalogue_clip_sequencing(): void {
  const part = (seconds: number): IAutoMovieMotion =>
    makeMotion(
      [
        keyframe(0, makePose([]), "easeIn"),
        keyframe(seconds, makePose([]), "step"),
      ],
      seconds,
    );
  const first = part(1);
  const second = part(2);
  const joined = sequenceMotion("joined", [first, second], true);
  TestValidator.equals(
    "clock and interpolation owner",
    joined.keyframes.map((key) => [key.time, key.easing]),
    [
      [0, "easeIn"],
      [first.duration, "easeIn"],
      [first.duration + second.duration, "step"],
    ],
  );
  TestValidator.equals(
    "clip envelope",
    [joined.duration, joined.skeleton, joined.loop],
    [3, first.skeleton, true],
  );
  TestValidator.equals(
    "single clip defaults to a single play",
    sequenceMotion("once", [first]).loop,
    false,
  );
  TestValidator.predicate(
    "empty parts",
    throwsError(
      () => sequenceMotion("empty", []),
      "sequence parts must not be empty",
    ),
  );
  TestValidator.predicate(
    "incompatible rigs",
    throwsError(
      () => sequenceMotion("mixed", [first, { ...second, skeleton: "other" }]),
      "sequence part skeletons must match",
    ),
  );
  for (const duration of [0, -1, NaN])
    TestValidator.predicate(
      `invalid duration ${duration}`,
      throwsError(
        () => sequenceMotion("bad", [{ ...first, duration }]),
        "sequence part duration must be finite and positive",
      ),
    );
}
