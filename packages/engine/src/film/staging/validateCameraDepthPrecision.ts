import { ViolationCollector } from "../../validation/ViolationCollector";
import { isRecord } from "../../validation/isRecord";

/** Validate the authored fixed-point depth precision boundary. *
 *
 * @evidence requirements/staging/budgets-safety-and-validation.md#staging-spatial-validation Refuses depth-code counts outside safe-integer precision and non-positive metre step limits before camera lowering.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result Refuses depth-code counts outside safe-integer precision and non-positive metre step limits before camera lowering.
 */
export const validateCameraDepthPrecision = (
  value: unknown,
  path: string,
  out: ViolationCollector,
): void => {
  if (!isRecord(value)) {
    out.push("type", path, "camera depth precision must be an object", value);
    return;
  }
  const bits = value.minimumDepthBits;
  if (
    typeof bits !== "number" ||
    !Number.isSafeInteger(bits) ||
    bits <= 0 ||
    !Number.isSafeInteger(2 ** bits - 1)
  )
    out.push(
      "range",
      `${path}.minimumDepthBits`,
      "minimum depth bits must produce an exact positive safe-integer code count",
      bits,
    );
  const maximumStep = value.maximumStepMeters;
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
};
