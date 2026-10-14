import { ViolationCollector } from "./ViolationCollector";

/**
 * Reject nonfinite values and values below the supplied inclusive minimum, appending the caller's range path.
 *
 * @evidence contracts/common.md#principled-implementation Reject nonfinite values and values below the supplied inclusive minimum, appending the caller's range path.
 * @evidence contracts/common.md#clear-and-simple-design One scalar predicate serves material scales and coefficients without changing the collector's policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The minimum comes from the field's contract; negative values are not universally forbidden for all material fields.
 * @evidence contracts/common.md#meaningful-documentation The borrowed collector is advanced, and the supplied minimum is inclusive.
 * @evidence contracts/performance.md#efficient-algorithms Constant scalar work plus the diagnostic's label/path text is required.
 * @evidence contracts/performance.md#reuse-equivalent-work Material validators share this predicate, but each call appends its own effect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a failure row is retained by the caller-owned collector; no handle or task is acquired.
 */
export const finiteMinimum: (
  value: number,
  minimum: number,
  path: string,
  label: string,
  collector: ViolationCollector,
) => void = (
  value: number,
  minimum: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isFinite(value) || value < minimum)
    collector.push(
      "range",
      path,
      `${label} must be finite and >= ${minimum}`,
      value,
    );
};
