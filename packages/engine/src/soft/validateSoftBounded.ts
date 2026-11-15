import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Report a declared collection of a soft body that is larger than its
 * budget: its path, its size and how far past the budget it runs.
 *
 * @param out The collector.
 * @param path The collection's path.
 * @param label The collection's name in the message.
 * @param actual The declared size.
 * @param budget The largest size admitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is reported and with which numbers.
 * @evidence contracts/development/implementation.md#principled-implementation One comparison against the stated budget.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One condition, one finding.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A collection at its budget passes; one past it is reported with its excess, never truncated.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Writes only the caller's collector.
 */
export const validateSoftBounded: (
  out: ViolationCollector,
  path: string,
  label: string,
  actual: number,
  budget: number,
) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  actual: number,
  budget: number,
): void => {
  if (actual > budget)
    out.push(
      "range",
      path,
      `a soft body may declare at most ${budget} ${label}, but declared ${actual}`,
      actual,
      actual - budget,
    );
};
