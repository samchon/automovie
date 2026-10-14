import { sampleMotion } from "@automovie/engine";
import type {
  IAutoMovieExpression,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  joint,
  keyframe,
  makeExpression,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { nclose } from "../internal/predicates";

const rest: IAutoMoviePose = makePose([joint("leftLowerArm", { flexion: 0 })]);

/**
 * Observe same-preset intensity interpolation and the explicit different-preset switching convention. The unit samples expression data without asserting facial mesh deformation or that every pair of emotion presets lacks a meaningful blend.
 *
 * Scenarios:
 *
 * 1. Same preset (happy 0 → happy 1): intensity blends to 0.5 at t=0.5.
 * 2. Different presets (happy → angry): the first holds before the midpoint (t=0.4
 *    → happy) and the second takes over after it (t=0.6 → angry).
 *
 * @evidence contracts/testing.md#behavioral-verification Samples an authored happy intensity ramp and opposite sides of a happy-to-angry segment, observing non-null midpoint intensity 0.5 and literal preset names before/after the switch.
 * @evidence contracts/testing.md#independent-expectations Linear midpoint between local intensities 0/1 is 0.5; the documented preset convention selects happy at eased 0.4 and angry at 0.6. Literal expectations are independent of interpolateExpression, with the original intensity tolerance retained.
 * @evidence contracts/testing.md#distinguishing-cases Retains same versus different presets and both sides of the midpoint. Exact midpoint equality, nonlinear easing, null endpoints and blendshape channels belong to the other existing sampler units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns three direct sample calls over local fixture clips. Shared constructors register no extra cases and start no viewer, process or native artifact.
 */
export function test_motion_sample_expression(): void {
  const blend: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, rest, "linear", makeExpression("happy", 0)),
      keyframe(1, rest, "linear", makeExpression("happy", 1)),
    ],
    1,
  );
  const mid: IAutoMovieExpression | null = sampleMotion(blend, 0.5).expression;
  TestValidator.predicate("expression present", mid !== null);
  TestValidator.predicate(
    "intensity blends to 0.5",
    nclose(mid!.intensity, 0.5),
  );

  const swap: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, rest, "linear", makeExpression("happy", 1)),
      keyframe(1, rest, "linear", makeExpression("angry", 1)),
    ],
    1,
  );
  TestValidator.equals(
    "before midpoint → first preset",
    sampleMotion(swap, 0.4).expression!.preset,
    "happy",
  );
  TestValidator.equals(
    "after midpoint → second preset",
    sampleMotion(swap, 0.6).expression!.preset,
    "angry",
  );
}
