import type {
  IAutoMovieCameraDepthPrecisionConstraint,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Validate a staged camera's depth-precision requirement before it reaches the
 * resolved scene.
 *
 * `minimumDepthBits` must be a positive integer small enough that
 * `2^bits - 1`, the largest zero-based depth code, is a safe integer, so at
 * most 53, and `maximumStepMeters`, the largest accepted gap between adjacent
 * representable depths, must be greater than zero. Violations
 * go to `out` at `<path>.minimumDepthBits` and `<path>.maximumStepMeters`.
 *
 * @param value The authored requirement.
 * @param path Violation path of the requirement.
 * @param out Collector the violations are appended to.
 */
export function validateCameraDepthPrecision(
  value: IAutoMovieCameraDepthPrecisionConstraint,
  path: string,
  out: IAutoMovieViolationCollector,
): void {
  const bits: number = value.minimumDepthBits;
  if (
    bits <= 0
  )
    out.push(
      "range",
      `${path}.minimumDepthBits`,
      "minimum depth bits must produce an exact positive safe-integer maximum code index",
      bits,
    );
  const maximumStep: number = value.maximumStepMeters;
  if (maximumStep <= 0)
    out.push(
      "range",
      `${path}.maximumStepMeters`,
      "maximum adjacent depth step must be greater than zero metres",
      maximumStep,
    );
}
