

/**
 * Require a positive safe-integer glTF count or declared byte length.
 *
 * @evidence contracts/common.md#principled-implementation Type, safe-integer and strict-positive checks reject nonnumeric, fractional, zero and unsafe values before range arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design The scalar gate is shared by buffer lengths, view lengths and accessor counts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A count is not rounded, clamped or silently replaced with a default value.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies safe-integer positivity, named-path errors and unchanged caller input.
 * @evidence contracts/performance.md#efficient-algorithms Three scalar predicates require constant time without metadata traversal or allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated schema owners use the same positive-count predicate; no value admission cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The predicate retains no metadata and allocates only an error when refusing a value.
 * @author Samchon
 */
export const positiveInteger: (value: unknown, path: string) => void = (value: unknown, path: string): void => {
  if (
    typeof value !== "number" ||
    Number.isSafeInteger(value) === false ||
    value <= 0
  )
    throw new Error(`${path} must be a positive safe integer.`);
};
