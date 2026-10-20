/**
 * Adapt a scalar ground height or preserve a supplied ground callback.
 *
 * @evidence contracts/common.md#principled-implementation JavaScript's number/function distinction selects a constant-height closure or the original callable identity; the adapter does not validate height finiteness or callback purity.
 * @evidence contracts/common.md#clear-and-simple-design The scalar/callback boundary is resolved once for motion and ground-validation consumers instead of duplicating their dispatch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied callback's effects and exceptions remain observable, and a nonfinite scalar is returned unchanged rather than becoming a default plane.
 * @evidence contracts/common.md#meaningful-documentation Documents metre-valued ground output, original callback identity and scalar closure ownership without implying space admission.
 * @evidence contracts/performance.md#efficient-algorithms Dispatch is constant time and space; actual query cost belongs to the supplied callback.
 * @evidence contracts/performance.md#reuse-equivalent-work Callable inputs are reused by identity, while each scalar adaptation creates its own immutable-value closure.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure retains only its scalar, or the caller retains its original function; no geometry, task or host handle is acquired.
 */
export const groundFunction: (
  ground: number | ((x: number, z: number) => number),
) => (x: number, z: number) => number = (
  ground: number | ((x: number, z: number) => number),
): ((x: number, z: number) => number) =>
  typeof ground === "number" ? (): number => ground : ground;
