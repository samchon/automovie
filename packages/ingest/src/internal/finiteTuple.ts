/**
 * Read a finite numeric tuple with a glTF default when omitted.
 *
 * Undefined copies the caller's fallback without validating it; motion-node callers supply finite three- or four-component glTF defaults. Present arrays must have the same length and finite numeric entries, or throw with the field/index path. Both branches return a fresh array.
 *
 * @evidence contracts/common.md#principled-implementation Undefined copies the fixed fallback; supplied arrays must match its length and contain only finite numbers.
 * @evidence contracts/common.md#clear-and-simple-design The tuple gate owns numeric/arity admission while motion-node interpretation chooses translation, scale and quaternion defaults.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Wrong lengths and nonfinite values throw; supplied tuples are not normalized or padded to hide defects.
 * @evidence contracts/common.md#meaningful-documentation Comments identify omission, caller-owned copied output and indexed finite-value errors.
 * @evidence contracts/performance.md#efficient-algorithms Tuple length K drives O(K) time and result space; current callers use only three or four components.
 * @evidence contracts/performance.md#reuse-equivalent-work The same tuple admission serves translation, rotation and scale without cross-call caching of mutable inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned K-number array belongs to its caller and retains no reference to the source or fallback array.
 * @author Samchon
 */
export const finiteTuple: (
  value: unknown,
  path: string,
  fallback: readonly number[],
) => number[] = (
  value: unknown,
  path: string,
  fallback: readonly number[],
): number[] => {
  if (value === undefined) return [...fallback];
  if (Array.isArray(value) === false || value.length !== fallback.length)
    throw new Error(
      `${path} must contain exactly ${fallback.length} finite numbers.`,
    );
  return (value as unknown[]).map((entry: unknown, index: number): number => {
    if (typeof entry !== "number" || Number.isFinite(entry) === false)
      throw new Error(`${path}[${index}] must be finite.`);
    return entry;
  });
};
