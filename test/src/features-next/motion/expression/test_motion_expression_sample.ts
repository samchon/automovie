import { sampleMotion } from "@automovie/engine";
import type {
  IAutoMovieExpression,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  keyframe,
  makeExpression,
  makeMotion,
  makePose,
} from "../../../features/internal/fixtures";
import { nclose } from "../../../features/internal/nclose";

/**
 * Blendshape weights interpolate from their own channel values, including an absent neutral endpoint.
 *
 * Scenarios:
 * 1. Blend a jaw channel and a one-sided smile at one quarter of a one-second interval; then fade the facial preset to neutral.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Blendshape weights interpolate from their own channel values, including an absent neutral endpoint.
 * @evidence contracts/development/testing.md#independent-expectations Linear weighting leaves three quarters of the initial smile and introduces a quarter of the final jaw weight.
 * @evidence contracts/development/testing.md#distinguishing-cases Absent channels and an absent whole expression have distinct output representations.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_expression_sample(): void {
  const pose: IAutoMoviePose = makePose([]);
  const first = makeExpression("happy", 1, [
    { channel: "mouthSmileLeft", weight: 0.8 },
  ]);
  const last = makeExpression("happy", 1, [
    { channel: "jawOpen", weight: 0.4 },
  ]);
  const clip = (end: IAutoMovieExpression | null): IAutoMovieMotion =>
    makeMotion(
      [keyframe(0, pose, "linear", first), keyframe(1, pose, "linear", end)],
      1,
    );
  const blend = sampleMotion(clip(last), 0.25).expression!;
  TestValidator.predicate(
    "independent coefficients",
    nclose(
      blend.blendshapes!.find((c) => c.channel === "mouthSmileLeft")!.weight,
      0.6,
    ) &&
      nclose(
        blend.blendshapes!.find((c) => c.channel === "jawOpen")!.weight,
        0.1,
      ),
  );
  TestValidator.predicate(
    "fade to neutral",
    nclose(sampleMotion(clip(null), 0.25).expression!.intensity, 0.75),
  );
}
