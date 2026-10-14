import type {
  AutoMovieEasing,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateMotion } from "../../../../packages/engine/src/validation/validateMotion";
import { createSkeleton } from "../internal/createSkeleton";
import { createValidMotion } from "../internal/createValidMotion";
import { hasViolation } from "../internal/hasViolation";

/**
 * Exercise the closed keyframe easing menu through motion admission.
 *
 * Scenarios:
 * 1. An otherwise valid two-keyframe clip uses unknown bounce easing on its first keyframe and fails with a type violation at easing.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion after replacing only the first easing name, requiring refusal at easing and catching acceptance of an unsupported evaluator variant.
 * @evidence contracts/testing.md#independent-expectations The supported easing union excludes bounce; its rejection and field address are literal menu expectations rather than evaluated easing samples.
 * @evidence contracts/testing.md#distinguishing-cases Owns an unknown easing on an otherwise supported clip; motion_valid retains linear acceptance and keyframe_bezier owns cubic control domains.
 * @evidence contracts/testing.md#execution-ownership This named portable unit uses the existing clip/rig factories and creates no evaluator host or dynamically registered cases.
 */
export function test_validation_motion_keyframe_easing(): void {
  const base: IAutoMovieMotion = createValidMotion();
  const motion: IAutoMovieMotion = {
    ...base,
    keyframes: base.keyframes.map(
      (kf: IAutoMovieKeyframe, i: number): IAutoMovieKeyframe =>
        i === 0 ? { ...kf, easing: "bounce" as AutoMovieEasing } : kf,
    ),
  };

  const result: IAutoMovieValidation = validateMotion({
    motion,
    skeleton: createSkeleton(),
  });
  TestValidator.equals("unknown easing fails", result.success, false);
  TestValidator.predicate(
    "easing type violation",
    hasViolation(result, "type", ".easing"),
  );
}
