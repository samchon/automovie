/**
 * Own one whole-project source transformation between filesystem invalidations.
 * The compiler adapter supplies a complete path-to-TypeScript map or rejects;
 * this owner never publishes partial or failed generations. Watching includes
 * source membership, compiler inputs and configuration, not just runtime imports.
 * Its lifetime is separate from numerical model and GPU caches.
 *
 * The compile is asynchronous because it runs in a process of its own: lookups
 * that arrive while a generation compiles share it and wait, and the server
 * keeps answering its other requests. An invalidation during a compile only
 * withdraws that generation from later lookups, which start a fresh one.
 *
 * @evidence contracts/common.md#principled-implementation Every module in a generation comes from one completed project transformation and any invalidation withdraws that authority.
 * @evidence contracts/common.md#clear-and-simple-design One compiler callback owns generation and a map owns module lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stores actual transformed source rather than generated validators or expected outputs.
 * @evidence contracts/common.md#meaningful-documentation Explains complete-generation publication, failure and input-watch obligations.
 */
export function createHumanViewerCompilation(
  compile: () => Promise<Record<string, string>>,
) {
  let generation: Promise<Record<string, string>> | undefined;
  return {
    source: async (file: string): Promise<string | undefined> => {
      const started = (generation ??= compile());
      try {
        return (await started)[file];
      } catch (error) {
        if (generation === started) generation = undefined;
        throw error;
      }
    },
    invalidate: (): void => {
      generation = undefined;
    },
  };
}
