import { ViolationCollector } from "./ViolationCollector";
/**
 * Append identity findings for nonstrings and whitespace-only strings.
 *
 * @evidence contracts/common.md#principled-implementation A typeof string check precedes trim length, yielding exactly one type finding at the supplied path for a nonstring or blank string.
 * @evidence contracts/common.md#clear-and-simple-design The collector owns result accumulation while the caller supplies resource-specific label and path; identity existence and uniqueness are separate gates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonblank untrimmed ids are accepted unchanged; this rule neither coerces unknown values nor silently rewrites author identities.
 * @evidence contracts/common.md#meaningful-documentation States unknown-input shape, blank-string predicate, type-kind result and the absence of reference/uniqueness or trimmed-spelling admission.
 * @evidence contracts/performance.md#efficient-algorithms Nonstring input takes constant work; a string costs its trim traversal and at most one finding allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work One shared predicate/message form serves different resource labels without a cache of mutable author records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a refused value and newly allocated finding are retained in the supplied collector; any trim result is temporary and no resource handle is acquired.
 * @author Samchon
 */
export const collectNonEmptyId: (value: unknown, path: string, label: string, collector: ViolationCollector) => void = (
  value: unknown,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (typeof value !== "string") {
    collector.push("type", path, `${label} must be a string`, value);
    return;
  }
  if (value.trim().length === 0)
    collector.push("type", path, `${label} must be a non-empty id`, value);
};
