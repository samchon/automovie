import { validateMotion } from "@automovie/engine";
import type {
  AutoMovieViolationKind,
  IAutoMovieKeyframe,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { createValidMotion } from "../internal/createValidMotion";
import { hasViolation } from "../internal/hasViolation";

/**
 * Easing selects the control payload. Cubic X coordinates must be unit-interval values,
 * while finite Y values may overshoot.
 *
 * Scenarios:
 * 1. Stray controls and missing or non-finite cubic controls name their field.
 * 2. Either cubic X coordinate is bounded at both ends. Finite Y overshoot is admitted.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Observes the public clip validator's field and kind.
 * @evidence contracts/development/testing.md#independent-expectations Four dense finite coefficients define a cubic and its X controls are times.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates control presence and coordinate range.
 * @evidence contracts/development/testing.md#execution-ownership Changes only the first key of a valid clip.
 * @evidence contracts/development/common.md#meaningful-documentation States the payload and coordinate rules.
 */
export function test_validation_motion_clip_easing_domain(): void {
  const motion = createValidMotion();
  const skeleton = createSkeleton();
  const check = (patch: Partial<IAutoMovieKeyframe>) =>
    validateMotion({
      skeleton,
      motion: {
        ...motion,
        keyframes: [
          { ...motion.keyframes[0]!, ...patch },
          motion.keyframes[1]!,
        ],
      },
    });
  const refused = (
    patch: Partial<IAutoMovieKeyframe>,
    kind: AutoMovieViolationKind,
    path: string,
  ): void => {
    TestValidator.predicate(path, hasViolation(check(patch), kind, path));
  };
  refused({ easing: "linear", bezier: [0, 0, 1, 1] }, "type", ".bezier");
  for (const controls of [null,] as IAutoMovieKeyframe["bezier"][])
    refused({ easing: "cubicBezier", bezier: controls }, "type", ".bezier");
  for (const index of [0, 2])
    for (const outside of [-1, 2]) {
      const bezier: [number, number, number, number] = [0, 0, 1, 1];
      bezier[index] = outside;
      refused({ easing: "cubicBezier", bezier }, "range", ".bezier");
    }
  TestValidator.equals(
    "closed X domain with overshooting Y",
    check({ easing: "cubicBezier", bezier: [0, -2, 1, 3] }).success,
    true,
  );
}
