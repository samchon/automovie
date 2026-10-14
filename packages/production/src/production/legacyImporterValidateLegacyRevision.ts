

/**
 * Require a revision property that is a nonnegative safe integer; malformed, absent or unsafe values throw with the file whose record supplied them.
 *
 * @evidence contracts/common.md#principled-implementation Number type, safe-integer and nonnegative checks match the resident revision's integer comparison semantics without rounding unsafe inputs.
 * @evidence contracts/common.md#clear-and-simple-design Owns scalar revision admission and leaves optional-file initial-zero meaning to the revision snapshot reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not normalize fractional, negative or string values into a usable revision.
 * @evidence contracts/common.md#meaningful-documentation States nonnegative safe-integer requirements and path-specific refusal.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar checks cost constant application work; error message allocation follows file-path length.
 * @evidence contracts/performance.md#reuse-equivalent-work No mutable record is cached as validated, and absence is handled only by the owning optional-file reader.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a scalar or throws one Error without acquiring a descriptor, lock or retained task.
 */
export const legacyImporterValidateLegacyRevision: (value: unknown, file: string) => number = (value: unknown, file: string): number => {
  const revision: unknown = (value as { revision?: unknown } | null)?.revision;
  if (
    typeof revision !== "number" ||
    Number.isSafeInteger(revision) === false ||
    revision < 0
  )
    throw new Error(
      `Legacy revision "${file}" must contain one non-negative safe integer.`,
    );
  return revision;
};
