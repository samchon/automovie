import type {
  IAutoMovieKeyframe,
  IAutoMoviePose,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateMotion } from "../../../../packages/engine/src/validation/validateMotion";
import { createSkeleton } from "../internal/createSkeleton";
import { hasViolation } from "../internal/hasViolation";
import { joint } from "../internal/joint";
import { keyframe } from "../internal/keyframe";
import { makeMotion } from "../internal/makeMotion";
import { makePose } from "../internal/makePose";
import { namedFacts } from "../internal/namedFacts";

const pose: (flexion: number) => IAutoMoviePose = (
  flexion: number,
): IAutoMoviePose => makePose([joint("leftLowerArm", { flexion })]);

const validate: (duration: number, times: number[]) => IAutoMovieValidation = (
  duration: number,
  times: number[],
): IAutoMovieValidation =>
  validateMotion({
    motion: makeMotion(
      times.map(
        (time: number, i: number): IAutoMovieKeyframe =>
          keyframe(time, pose(i * 10)),
      ),
      duration,
    ),
    skeleton: createSkeleton(),
  });

/**
 * Exercise positive finite motion duration and finite keyframe time admission before interpolation.
 *
 * Scenarios:
 *
 * 1. `duration: Infinity` yields a temporal violation on `$input.duration`.
 * 2. `duration: 0` yields a temporal violation on `$input.duration`.
 * 3. `keyframes[i].time: NaN` yields a temporal violation on that keyframe time.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion for infinite/zero duration and NaN keyframe time, requiring refusal and each exact temporal field address.
 * @evidence contracts/testing.md#independent-expectations Duration must be finite and greater than zero, and times must be finite seconds; zero, infinity and NaN violate those literal domains without interpreting generated samples.
 * @evidence contracts/testing.md#distinguishing-cases Separates duration positivity/finiteness from keyframe-time finiteness; motion_valid supplies finite positive timing and time_order/time_duration own sequence bounds.
 * @evidence contracts/testing.md#execution-ownership This named unit uses local pose/clip adapters and existing portable factories, without a clock host, sampler or dynamic registration.
 */
export function test_validation_motion_non_finite_timing(): void {
  const infiniteDuration: IAutoMovieValidation = validate(
    Number.POSITIVE_INFINITY,
    [0, 1],
  );
  TestValidator.equals(
    "infinite motion duration fails",
    infiniteDuration.success,
    false,
  );
  TestValidator.equals(
    "infinite duration rejected",
    namedFacts([
      ["refused", (): boolean => infiniteDuration.success === false],
      [
        "violated",
        (): boolean =>
          infiniteDuration.success === false &&
          hasViolation(infiniteDuration, "temporal", "$input.duration"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const zeroDuration: IAutoMovieValidation = validate(0, [0, 1]);
  TestValidator.equals(
    "zero motion duration fails",
    zeroDuration.success,
    false,
  );
  TestValidator.equals(
    "zero duration rejected at duration",
    namedFacts([
      ["refused", (): boolean => zeroDuration.success === false],
      [
        "violated",
        (): boolean =>
          zeroDuration.success === false &&
          hasViolation(zeroDuration, "temporal", "$input.duration"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const nanTime: IAutoMovieValidation = validate(1, [0, Number.NaN]);
  TestValidator.equals(
    "non-finite keyframe time fails",
    nanTime.success,
    false,
  );
  TestValidator.equals(
    "non-finite keyframe time rejected",
    namedFacts([
      ["refused", (): boolean => nanTime.success === false],
      [
        "violated",
        (): boolean =>
          nanTime.success === false &&
          hasViolation(nanTime, "temporal", "$input.keyframes[1].time"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
