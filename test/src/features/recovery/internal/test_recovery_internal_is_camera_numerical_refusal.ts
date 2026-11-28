import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `isRecoveryCameraNumericalRefusal` recognises the camera solver's own
 * declared numerical refusals: a plain Error whose message opens with one of
 * its prefixes.
 *
 * Scenarios:
 *
 * 1. "camera-pose: …", "singular-matrix: …" and "matrix3: …" plain Errors are
 *    refusals.
 * 2. A RangeError with a refusal prefix and a plain Error with another message are
 *    not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the error-category and message-prefix boundary.
 * @evidence contracts/development/testing.md#behavioral-verification Passes known numerical errors, a matching RangeError and an unrelated Error through the classifier.
 * @evidence contracts/development/testing.md#independent-expectations The supplied strings and error classes independently identify every expected classification.
 */
export function test_recovery_internal_is_camera_numerical_refusal(): void {
  TestValidator.predicate(
    "declared refusals",
    [
      "camera-pose: degenerate",
      "singular-matrix: rank 2",
      "matrix3: zero",
    ].every((message: string): boolean =>
      AutoMovieRecoveryCameraMap.isCameraNumericalRefusal(new Error(message)),
    ),
  );
  TestValidator.predicate(
    "other failures",
    !AutoMovieRecoveryCameraMap.isCameraNumericalRefusal(new RangeError("camera-pose: x")) &&
      !AutoMovieRecoveryCameraMap.isCameraNumericalRefusal(new Error("unexpected")),
  );
}
