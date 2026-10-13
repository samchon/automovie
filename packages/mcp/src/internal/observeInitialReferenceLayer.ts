/**
 * Observe the initially requested layer. Only its initial absence can become
 * an empty population, and only after the bound root is rechecked. A missing
 * root or a later walk failure must still propagate; this boundary never
 * handles disappearance after a walk has begun.
 *
 *
 * @evidence contracts/common.md#principled-implementation Only ENOENT from the initial requested-layer observation becomes null, after root recheck succeeds; later walk failures are outside this boundary.
 * @evidence contracts/common.md#clear-and-simple-design A small generic observation boundary distinguishes absent population from a disappeared bound root.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Other thrown values propagate, and root-recheck failure cannot be converted into an empty layer.
 * @evidence contracts/common.md#meaningful-documentation The comment names initial absence, root recheck and later-failure ownership; null represents only admitted initial absence.
 * @evidence contracts/performance.md#efficient-algorithms One initial observation and at most one root recheck add no population traversal beyond their injected operations.
 * @evidence contracts/performance.md#reuse-equivalent-work Observation effects execute on every request; no absent-layer answer is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function retains only its current observation or error until completion; injected operations own their physical resources.
 */
export async function observeInitialReferenceLayer<T>(
  inspect: () => Promise<T>,
  recheckRoot: () => Promise<void>,
): Promise<T | null> {
  try {
    return await inspect();
  } catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await recheckRoot();
      return null;
    }
    throw error;
  }
}
