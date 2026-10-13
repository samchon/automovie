

/**
 * Refuses an empty or purely subtractive glob population at the API boundary.
 *
 * @evidence contracts/common.md#principled-implementation Require a nonblank positive selector, reject blank entries and duplicate spellings, and preserve negative selectors alongside it.
 * @evidence contracts/common.md#clear-and-simple-design Local host and contract admission share this selector-population boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A purely subtractive population cannot silently disable a declared duty; glob matching is still owned by physical admission.
 * @evidence contracts/common.md#meaningful-documentation role identifies host or contract in rejection messages and input arrays are not modified.
 * @evidence contracts/performance.md#efficient-algorithms Two scans and a Set give linear selector-count work plus string trimming and hashing.
 * @evidence contracts/performance.md#reuse-equivalent-work The same validator serves both selector roles without retained results for mutable arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary set is released after completion or throw; the caller retains its input array.
 */
export function requirePositivePopulation(
  patterns: readonly string[],
  role: "contract" | "host",
): void {
  if (
    patterns.length === 0 ||
    !patterns.some(
      (pattern: string): boolean => pattern.trim().length !== 0 && !pattern.startsWith("!"),
    )
  )
    throw new Error(
      `A production-local contract claim requires a positive ${role} population.`,
    );
  if (patterns.some((pattern: string): boolean => pattern.trim().length === 0))
    throw new Error(
      `A production-local contract claim ${role} population contains a blank pattern.`,
    );
  if (new Set(patterns).size !== patterns.length)
    throw new Error(
      `A production-local contract claim ${role} population contains a duplicate pattern.`,
    );
}
