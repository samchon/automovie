/** What the last compile attempts left behind. */
export interface IHumanViewerCompilationStatus {
  /** The failure of the newest attempt, or null when it succeeded. */
  error: string | null;

  /** When the newest successful generation finished, or null before the first. */
  goodAt: string | null;
}

/**
 * Own one whole-project source transformation between filesystem invalidations.
 * The compiler adapter supplies a complete path-to-TypeScript map or rejects;
 * this owner never publishes a partial generation. Watching includes source
 * membership, compiler inputs and configuration, not just runtime imports.
 * Its lifetime is separate from numerical model and GPU caches.
 *
 * The compile is asynchronous because it runs in a process of its own: lookups
 * that arrive while a generation compiles share it and wait, and the server
 * keeps answering its other requests. An invalidation during a compile only
 * withdraws that generation from later lookups, which start a fresh one.
 *
 * Other sessions edit the working tree while this runs, so a compile can fail
 * on a half-written file. A failed attempt keeps serving the last generation
 * that compiled and reports the failure through `report`, together with when
 * that generation was made, so the display can say it is showing an older
 * build instead of passing it off as current; the next successful attempt
 * replaces it and clears the report. Before any generation has compiled there
 * is nothing to fall back to and the failure is thrown.
 *
 * @evidence contracts/common.md#principled-implementation Every module in a generation comes from one completed project transformation and any invalidation withdraws that authority.
 * @evidence contracts/common.md#clear-and-simple-design One compiler callback owns generation and a map owns module lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stores actual transformed source rather than generated validators or expected outputs.
 * @evidence contracts/common.md#meaningful-documentation Explains complete-generation publication, failure and input-watch obligations.
 */
export function createHumanViewerCompilation(
  compile: () => Promise<Record<string, string>>,
  report: (status: IHumanViewerCompilationStatus) => void = () => {},
  now: () => string = () => new Date().toISOString(),
) {
  let generation: Promise<Record<string, string>> | undefined;
  let good: Record<string, string> | undefined;
  let goodAt: string | null = null;
  return {
    source: async (file: string): Promise<string | undefined> => {
      const started = (generation ??= compile().then((files) => {
        good = files;
        goodAt = now();
        report({ error: null, goodAt });
        return files;
      }));
      try {
        return (await started)[file];
      } catch (error) {
        if (generation === started) generation = undefined;
        report({
          error: error instanceof Error ? error.message : String(error),
          goodAt,
        });
        if (good === undefined) throw error;
        return good[file];
      }
    },
    invalidate: (): void => {
      generation = undefined;
    },
  };
}
