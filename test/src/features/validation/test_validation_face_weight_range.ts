import { validateFaceResult } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeFace } from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";

/**
 * A lone side supplies both paired targets, so an excessive source weight produces two range findings with the same authored source path.
 *
 * Scenarios:
 * 1. Lone left-eye size 2.1 fails with exactly two range findings naming eyes.left.size.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual face validation on a lone-side overflow and checks failed admission, exact finding population and common source path, catching lost mirroring or a diagnostic pointing at an unauthored right field.
 * @evidence contracts/testing.md#independent-expectations The documented side rule emits two targets from the lone source, and 2.1 exceeds their inclusive +2 bound; the literal count, kind and source address judge behavior independently of the flattening implementation.
 * @evidence contracts/testing.md#distinguishing-cases Owns mirrored upper overflow; the negative jaw neighbor, accepted endpoints, distinct sides and empty document belong to separate face tests.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit uses the existing face identity fixture and reads engine diagnostics without loading a Human asset, native artifact or renderer.
 */
export function test_validation_face_weight_range(): void {
  const result: IAutoMovieValidation = validateFaceResult(
    makeFace({ eyes: { left: { size: 2.1 } } }),
  );
  TestValidator.equals("out-of-range weight fails", result.success, false);
  TestValidator.equals(
    "both mirrored targets violate at the source field",
    namedFacts([
      ["resultSuccess", (): boolean => result.success === false],
      [
        "resultViolations",
        (): boolean =>
          result.success === false && result.violations.length === 2,
      ],
      [
        "resultViolationsV",
        (): boolean =>
          result.success === false &&
          result.violations.every(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.kind === "range" && v.path.includes(".eyes.left.size"),
          ),
      ],
    ]),
    { resultSuccess: true, resultViolations: true, resultViolationsV: true },
  );
}
