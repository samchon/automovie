import type { IHumanViewerCompilationStatus } from "./IHumanViewerCompilationStatus";
import type { IHumanViewerCompiledSource } from "./IHumanViewerCompiledSource";

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
 * withdraws that generation from later lookups, which start a fresh one. At
 * most one compile process runs: a fresh generation waits for the running
 * one, and a queued generation that is itself invalidated before it starts
 * never compiles, so a burst of edits costs one compile after the running one
 * rather than one overlapping compile per edit.
 *
 * Other sessions edit the working tree while this runs, so a compile can fail
 * on a half-written file. A failed attempt keeps serving the last generation
 * that compiled and reports the failure through `report`, together with when
 * that generation was made, so the display can say it is showing an older
 * build instead of passing it off as current; the next successful attempt
 * replaces it and clears the report. Before any generation has compiled there
 * is nothing to fall back to and the failure is thrown.
 *
 * Each module is returned with the identity of the compile that produced it
 * (its completion time and sequence), so the served code can say which
 * compile a page or worker loaded.
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
  let epoch = 0;
  let good: Record<string, string> | undefined;
  /** Identity of each compiled generation, by its file map. */
  const names = new WeakMap<Record<string, string>, string>();
  let sequence = 0;
  let goodAt: string | null = null;
  // The compile process that is running or queued last. A new compile waits
  // for it instead of running beside it: overlapping compiles of a source
  // that keeps changing each ran slower and all but the last were discarded.
  let running: Promise<unknown> = Promise.resolve();
  /** The generation of the current epoch, starting its compile when needed. */
  const current = (): Promise<Record<string, string>> => {
    if (generation !== undefined) return generation;
    const selectedEpoch = epoch;
    const compiled = running
      .catch(() => undefined)
      .then(() =>
        // Superseded while it waited: no compile runs for an obsolete epoch.
        selectedEpoch === epoch ? compile() : null,
      );
    running = compiled;
    const started: Promise<Record<string, string>> = compiled.then((files) => {
      if (files === null) {
        if (generation === started) generation = undefined;
        return current();
      }
      names.set(files, now() + "#" + ++sequence);
      if (selectedEpoch === epoch) {
        good = files;
        goodAt = now();
        report({ error: null, goodAt });
      }
      return files;
    });
    generation = started;
    return started;
  };
  return {
    source: async (
      file: string,
    ): Promise<IHumanViewerCompiledSource | undefined> => {
      const selectedEpoch = epoch;
      const started = current();
      const named = (
        files: Record<string, string>,
      ): IHumanViewerCompiledSource | undefined =>
        files[file] === undefined
          ? undefined
          : { code: files[file], compile: names.get(files) ?? "unnamed" };
      try {
        return named(await started);
      } catch (error) {
        if (generation === started) generation = undefined;
        if (selectedEpoch === epoch)
          report({
            error: error instanceof Error ? error.message : String(error),
            goodAt,
          });
        if (good === undefined) throw error;
        return named(good);
      }
    },
    invalidate: (): void => {
      ++epoch;
      generation = undefined;
    },
  };
}
