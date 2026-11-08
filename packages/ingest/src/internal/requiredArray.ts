/**
 * Require an actual JSON array at a named external-document path.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Array.isArray admits only array values; rejected inputs report their owning JSON path.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shape gate centralizes array identity for structural, motion and skin inspection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Objects, null and array-looking values are refused rather than coerced into synthetic inventories.
 * @evidence contracts/development/common.md#meaningful-documentation Prose states input identity, path-named failure and that admitted arrays are borrowed unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms One Array.isArray check is constant-time without scanning or copying elements.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All optional-array handling delegates this same identity check when a value is present.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The helper allocates no collection and returns the caller's existing array reference.
 */
export const requiredArray: (value: unknown, path: string) => unknown[] = (
  value: unknown,
  path: string,
): unknown[] => {
  if (Array.isArray(value) === false)
    throw new Error(`${path} must be an array.`);
  return value as unknown[];
};
