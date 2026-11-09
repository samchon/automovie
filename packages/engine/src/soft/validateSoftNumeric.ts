import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Append a range violation for a non-finite scalar or an open/closed interval failure.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Number.isFinite and the authored endpoint comparisons decide admission; infinite internal endpoints are sentinels while the tested value must remain finite.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Planting and soft-domain owners share this scalar policy while retaining their own labels, paths and limits.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid values are reported unchanged rather than clamped, and the exclusive flag applies only to the lower bound.
 * @evidence contracts/development/common.md#meaningful-documentation States finite-scalar admission, interval spelling, range kind and append-only collector effect.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed comparisons take constant scalar work; a failing value allocates one violation and its path/message strings.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One predicate/message owner replaces byte-identical private copies without changing call order or caller limits.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the supplied collector retains an appended violation; no value cache or host handle is acquired.
 */
export const validateSoftNumeric: (
  out: ViolationCollector,
  path: string,
  label: string,
  value: number,
  min: number,
  exclusive: boolean,
  max: number,
) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  value: number,
  min: number,
  exclusive: boolean,
  max: number,
): void => {
  if (
    !Number.isFinite(value) ||
    (exclusive ? value <= min : value < min) ||
    value > max
  )
    out.push(
      "range",
      path,
      `${label} must be finite within ${exclusive ? "(" : "["}${min}, ${max}]`,
      value,
    );
};
