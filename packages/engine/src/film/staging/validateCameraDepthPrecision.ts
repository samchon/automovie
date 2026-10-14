import { ViolationCollector } from "../../validation/ViolationCollector";
import { isRecord } from "../../validation/isRecord";

/**
 * Validate a staged camera's depth-precision requirement before it reaches the resolved scene.
 *
 * The value must be an object whose `minimumDepthBits` is a positive integer small enough that `2^bits - 1`, the largest zero-based depth code, is a safe integer, so at most 53, and whose `maximumStepMeters`, the largest accepted gap between adjacent representable depths, is a finite number greater than zero. Values are read as `unknown`, because `stage` is reachable in-process without the transport's structural gate. Violations go to `out` at `<path>`, `<path>.minimumDepthBits` and `<path>.maximumStepMeters`.
 *
 * @param value The authored requirement, unchecked.
 * @param path Violation path of the requirement.
 * @param out Collector the violations are appended to.
 *
 * @evidence contracts/common.md#principled-implementation Bounds the bit count by exact representability of the largest zero-based code index used by the depth-precision evaluator rather than an arbitrary hardware list. That index is also the number of adjacent code intervals, while the number of distinct codes is 2^bits. The authored tolerance contract requires a strictly positive step; this input policy does not imply that every evaluated interval has positive error, since a point interval at the near plane can report zero.
 * @evidence contracts/common.md#clear-and-simple-design One validator for the camera's depth-precision field, called by `stageScene` beside the other camera checks, so the evaluator downstream can assume both numbers are usable.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No camera or bit depth is special-cased and nothing is defaulted; a missing requirement is a type violation because the scene camera must state one.
 * @evidence contracts/common.md#meaningful-documentation States the accepted shape, both bounds with their meaning and units, the 53-bit ceiling and its reason, why values are unknown, and the reported paths.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two field checks in constant time, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Checks one camera's requirement per call and coordinates no work across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing itself; it appends at most two violations per call to `out`, which the caller owns.
 */
export function validateCameraDepthPrecision(
  value: unknown,
  path: string,
  out: ViolationCollector,
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
