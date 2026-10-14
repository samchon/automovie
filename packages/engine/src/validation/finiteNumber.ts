import { ViolationCollector } from "./ViolationCollector";

/**
 * Require a finite scalar while preserving either sign for fields such as normal scale.
 *
 * @evidence contracts/common.md#principled-implementation Require a finite scalar while preserving either sign for fields such as normal scale.
 * @evidence contracts/common.md#clear-and-simple-design Finiteness is separate from lower-bound admission in finiteMinimum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No positive default replaces NaN, infinity or a negative-but-finite normal scale.
 * @evidence contracts/common.md#meaningful-documentation The declaration identifies finite-only admission and append-only diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms One finite test costs constant work apart from failure text.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers share the check while reading their current scalar values anew.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The collector owns appended rows; the helper retains no input history.
 */
export const finiteNumber: (value: number, path: string, label: string, collector: ViolationCollector) => void = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isFinite(value))
    collector.push("range", path, `${label} must be finite`, value);
};
