import { sampleMotion } from "@automovie/engine";
import type { IAutoMovieExpression, IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  joint,
  keyframe,
  makeExpression,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const rest: IAutoMoviePose = makePose([joint("leftLowerArm", { flexion: 0 })]);

/**
 * Observe null-expression neutral intensity in both interpolation directions and preserved null when neither endpoint is authored. This measures expression records rather than rendered resting faces.
 *
 * Scenarios:
 *
 * 1. Neutral to happy(1) retains happy, is below 0.2 at t=0.1 and samples 0.5 at t=0.5; near-end ramp intensity is not asserted.
 * 2. Happy(1) → neutral: the intensity fades out symmetrically (0.5 at t=0.5).
 * 3. Neutral → neutral: no expression is sampled (null).
 *
 * @evidence contracts/testing.md#behavioral-verification Samples the existing ramp-in, fade-out and unauthored clips, observing preset identity, low early/late intensities, midpoint 0.5 and null-null output. This catches holding a present endpoint at full strength.
 * @evidence contracts/testing.md#independent-expectations The local linear endpoints neutral 0 and happy 1 determine midpoint 0.5, while the preserved <0.2 inequalities distinguish the 0.1/0.9 clock sides from a full-strength hold. Literal names/null and existing tolerances come from authored semantics rather than interpolateExpression output.
 * @evidence contracts/testing.md#distinguishing-cases Retains null-to-present, present-to-null and null-to-null, early/mid/late samples and preset identity. Different-preset switching and detailed channel weights belong to separate existing units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns every direct sample call using existing in-memory fixture constructors. Named facts register no additional cases and no viewer, process or native artifact is started.
 */
export function test_motion_sample_expression_neutral(): void {
  // 1. an expression authored only at the FAR keyframe ramps in from neutral
  const rampIn: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, rest, "linear", null),
      keyframe(1, rest, "linear", makeExpression("happy", 1)),
    ],
    1,
  );
  const early: IAutoMovieExpression | null = sampleMotion(rampIn, 0.1).expression;
  const mid: IAutoMovieExpression | null = sampleMotion(rampIn, 0.5).expression;
  TestValidator.equals("ramp keeps the authored preset", mid!.preset, "happy");
  TestValidator.equals(
    "the intensity ramps from neutral, not a pop to full",
    namedFacts([
      ["early", (): boolean => early !== null],
      ["earlyIntensity", (): boolean => early !== null && early.intensity < 0.2],
      ["ncloseMidIntensity", (): boolean => nclose(mid!.intensity, 0.5)],
    ]),
    { early: true, earlyIntensity: true, ncloseMidIntensity: true },
  );

  // 2. an expression authored only at the NEAR keyframe fades out to neutral
  const fadeOut: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, rest, "linear", makeExpression("happy", 1)),
      keyframe(1, rest, "linear", null),
    ],
    1,
  );
  TestValidator.equals(
    "the intensity fades toward neutral",
    namedFacts([
      [
        "ncloseSampleMotionFadeOut",
        (): boolean => nclose(sampleMotion(fadeOut, 0.5).expression!.intensity, 0.5),
      ],
      [
        "sampleMotionFadeOutExpression",
        (): boolean => sampleMotion(fadeOut, 0.9).expression!.intensity < 0.2,
      ],
    ]),
    { ncloseSampleMotionFadeOut: true, sampleMotionFadeOutExpression: true },
  );

  // 3. neither side authored → no expression
  const none: IAutoMovieMotion = makeMotion(
    [keyframe(0, rest, "linear", null), keyframe(1, rest, "linear", null)],
    1,
  );
  TestValidator.equals(
    "an unauthored segment samples no expression",
    sampleMotion(none, 0.5).expression,
    null,
  );
}
