import type { IAutoMovieViolationCollector } from "@automovie/interface";

import { isRecord } from "../../validation/isRecord";

/**
 * Validate a staged camera's depth-precision requirement before it reaches the resolved scene.
 *
 * The value must be an object whose `minimumDepthBits` is a positive integer small enough that `2^bits - 1`, the largest zero-based depth code, is a safe integer, so at most 53, and whose `maximumStepMeters`, the largest accepted gap between adjacent representable depths, is a finite number greater than zero. Values are read as `unknown`, because `stage` is reachable in-process without the transport's structural gate. Violations go to `out` at `<path>`, `<path>.minimumDepthBits` and `<path>.maximumStepMeters`.
 *
 * @param value The authored requirement, unchecked.
 * @param path Violation path of the requirement.
 * @param out Collector the violations are appended to.
 */
export function validateCameraDepthPrecision(
  value: unknown,
  path: string,
  out: IAutoMovieViolationCollector,
): void {
  if (!isRecord(value)) {
    out.push("type", path, "camera depth precision must be an object", value);
    return;
  }
  const bits: unknown = value.minimumDepthBits;
  if (
    typeof bits !== "number" ||
    !Number.isSafeInteger(bits) ||
    bits <= 0 ||
    !Number.isSafeInteger(2 ** bits - 1)
  )
    out.push(
      "range",
      `${path}.minimumDepthBits`,
      "minimum depth bits must produce an exact positive safe-integer maximum code index",
      bits,
    );
  const maximumStep: unknown = value.maximumStepMeters;
  if (
    typeof maximumStep !== "number" ||
    !Number.isFinite(maximumStep) ||
    maximumStep <= 0
  )
    out.push(
      "range",
      `${path}.maximumStepMeters`,
      "maximum adjacent depth step must be finite and greater than zero metres",
      maximumStep,
    );
}
