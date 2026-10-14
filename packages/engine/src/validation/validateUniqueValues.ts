import { ViolationCollector } from "./ViolationCollector";

/**
 * Append duplicate faults while scanning typed value/path pairs with one local set.
 *
 * @evidence contracts/common.md#principled-implementation Append duplicate faults while scanning typed value/path pairs with one local set.
 * @evidence contracts/common.md#clear-and-simple-design Typed model/skeleton/affordance callers supply semantic identity and diagnostic location.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No value is trimmed, sorted, repaired or silently deduplicated.
 * @evidence contracts/common.md#meaningful-documentation First occurrence is retained as the reference and later duplicates report their own path.
 * @evidence contracts/performance.md#efficient-algorithms N rows take expected O(N) set work and O(U) storage plus key text cost.
 * @evidence contracts/performance.md#reuse-equivalent-work All typed identity lists share the same local duplicate policy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The seen set releases after checking while the caller owns appended rows.
 */
export const validateUniqueValues: (
  entries: ReadonlyArray<readonly [string, string]>,
  label: string,
  collector: ViolationCollector,
) => void = (
  entries: ReadonlyArray<readonly [string, string]>,
  label: string,
  collector: ViolationCollector,
): void => {
  const seen: Set<string> = new Set<string>();
  for (const [value, entryPath] of entries) {
    if (seen.has(value))
      collector.push(
        "type",
        entryPath,
        `${label} "${value}" must be unique within the model`,
        value,
      );
    seen.add(value);
  }
};
