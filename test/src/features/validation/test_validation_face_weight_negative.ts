import { validateFaceResult } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeFace } from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";

/**
 * Enforce the negative side of the signed face-weight interval at the authored field.
 *
 * Scenarios:
 * 1. Jaw width -2.1 without a chin fails with a range finding naming jaw.width.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual face validation and requires both failed admission and a range finding at the authored jaw-width path, catching an upper-bound-only check or wrong diagnostic provenance.
 * @evidence contracts/testing.md#independent-expectations Negative 2.1 lies below the documented inclusive -2 minimum; the expected kind and source field are literal contract facts rather than a copied report.
 * @evidence contracts/testing.md#distinguishing-cases Owns the negative outside neighbor with an omitted chin; accepted signed endpoints, empty input and mirrored upper overflow are separate face-validation entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry owns one local face document and reads actual validation output, without constructing Human geometry or starting a host.
 */
export function test_validation_face_weight_negative(): void {
  const result: IAutoMovieValidation = validateFaceResult(
    makeFace({ jaw: { width: -2.1 } }),
  );
  TestValidator.equals("below-range weight fails", result.success, false);
  TestValidator.equals(
    "range violation on the field",
    namedFacts([
      ["refused", (): boolean => result.success === false],
      [
        "violated",
        (): boolean =>
          result.success === false &&
          result.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.kind === "range" && v.path.includes(".jaw.width"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}
