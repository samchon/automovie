/**
 * Own one whole-project source transformation between filesystem invalidations.
 * The compiler adapter supplies a complete path-to-TypeScript map or throws;
 * this owner never publishes partial or failed generations. Watching includes
 * source membership, compiler inputs and configuration, not just runtime imports.
 * Its lifetime is separate from numerical model and GPU caches.
 *
 * @evidence contracts/common.md#principled-implementation Every module in a generation comes from one completed project transformation and any invalidation withdraws that authority.
 * @evidence contracts/common.md#clear-and-simple-design One compiler callback owns generation and a map owns module lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stores actual transformed source rather than generated validators or expected outputs.
 * @evidence contracts/common.md#meaningful-documentation Explains complete-generation publication, failure and input-watch obligations.
 */
export function createHumanViewerCompilation(
  compile: () => Record<string, string>,
) {
  let generation: Record<string, string> | undefined;
  return {
    source: (file: string): string | undefined => {
      generation ??= compile();
      return generation[file];
    },
    invalidate: (): void => {
      generation = undefined;
    },
  };
}
