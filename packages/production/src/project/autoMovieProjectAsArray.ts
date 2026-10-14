

/**
 * Borrow an actual array unchanged, or return a fresh empty array for any other value. Raw validators pair this projection with their explicit shape gates; an empty projection alone does not admit a malformed container.
 *
 * @evidence contracts/common.md#principled-implementation Array containers are borrowed; every other value yields an empty array.
 * @evidence contracts/common.md#clear-and-simple-design Supports raw validators while their explicit shape gates report malformed containers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This projection is not array-shape admission and skips no explicit owning gate.
 * @evidence contracts/common.md#meaningful-documentation States borrowed-array versus fresh-empty behavior.
 * @evidence contracts/performance.md#efficient-algorithms Constant container checking acquires no element traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Present arrays are reused directly rather than cloned.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the borrowed value; no global retention occurs.
 */
export const autoMovieProjectAsArray: (value: unknown) => unknown[] = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
