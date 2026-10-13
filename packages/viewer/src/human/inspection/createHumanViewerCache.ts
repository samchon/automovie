import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";

/**
 * Resident LRU bounded by size. Each entry reports its size once, when it is
 * stored; after a store the least recently used entries are withdrawn until the
 * selected total fits the budget again. The entry just stored is never released by its
 * own store, so one document larger than the whole budget can still be drawn,
 * alone. Reads move entries to the newest position; eviction and clearing
 * start owned retirement once. Selection stays synchronous, but callers await
 * settlement before treating release as completed. Pending and failed retirement
 * retain their counted bytes and original failure; withdrawal is not physical
 * release. Counted array bytes do not quantify GPU allocation or prove collection.
 * The caller supplies digest keys, the
 * size function and a disposer, so the same policy owns numerical and GPU
 * residents. A failed build is never inserted by the caller.
 *
 * @evidence contracts/common.md#principled-implementation Bounds selected residents by measured array size and separately retains pending or failed retirement bytes until the supplied owner's completion succeeds; neither sum certifies physical GPU release.
 * @evidence contracts/common.md#clear-and-simple-design Budget, size and disposal are explicit inputs; one cache-local set retains actual unfinished retirement completions while key computation stays with provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The eviction policy treats every document identically and cannot turn failed release into freed budget or a silently successful settlement.
 * @evidence contracts/common.md#meaningful-documentation Describes synchronous recency selection, awaited release, retained failure bytes and the array-accounting limit beside the oversize policy.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Keeps each withdrawn owner's actual completion and original failure observable instead of declaring removed cache membership successfully released.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Separates synchronous resident selection from awaited retirement and retains failed array accounting without disposing a borrowed renderer or claiming physical GPU memory.
 */
export function createHumanViewerCache<Value>(
  budget: number,
  size: (value: Value) => number,
  dispose: ((value: Value) => void) | ((value: Value) => Promise<void>),
) {
  if (!Number.isFinite(budget) || budget <= 0)
    throw new Error("Cache budget must be a positive finite size");
  const entries = new Map<string, Value>();
  const sizes = new Map<string, number>();
  const retirements = new Set<IHumanViewerCacheRetirement<Value>>();
  let total = 0;
  let retiringBytes = 0;
  const retire = (value: Value, bytes: number): void => {
    retiringBytes += bytes;
    const completion = createAutoMovieResourceRetirement([() => dispose(value)])();
    const retirement: IHumanViewerCacheRetirement<Value> = { value, bytes, completion };
    retirements.add(retirement);
    void completion.then(() => {
      retirements.delete(retirement);
      retiringBytes -= bytes;
    }).catch((error: unknown) => {
      retirement.failure = { error };
    });
  };
  const remove = (key: string): void => {
    const value = entries.get(key)!;
    const bytes = sizes.get(key)!;
    total -= bytes;
    entries.delete(key);
    sizes.delete(key);
    retire(value, bytes);
  };
  return {
    get: (key: string): Value | undefined => {
      if (!entries.has(key)) return undefined;
      const value = entries.get(key)!;
      const bytes = sizes.get(key)!;
      entries.delete(key);
      sizes.delete(key);
      entries.set(key, value);
      sizes.set(key, bytes);
      return value;
    },
    set: (key: string, value: Value): void => {
      const bytes = size(value);
      if (!Number.isFinite(bytes) || bytes < 0)
        throw new Error(
          "A cache entry size must be a finite nonnegative number",
        );
      if (entries.has(key)) {
        const previous = entries.get(key)!;
        const previousBytes = sizes.get(key)!;
        total -= previousBytes;
        entries.delete(key);
        sizes.delete(key);
        if (previous !== value) retire(previous, previousBytes);
      }
      entries.set(key, value);
      sizes.set(key, bytes);
      total += bytes;
      for (const oldest of entries.keys()) {
        if (total <= budget || oldest === key) break;
        remove(oldest);
      }
    },
    clear: (): void => {
      for (const key of entries.keys()) remove(key);
    },
    /** Withdraw the least recently used entry other than `keep`; callers await settlement and false means none is selectable. */
    evictOldest: (keep: string): boolean => {
      for (const oldest of entries.keys()) {
        if (oldest === keep) continue;
        remove(oldest);
        return true;
      }
      return false;
    },
    keys: (): string[] => [...entries.keys()],
    /** Await actual withdrawn owners; failed completions remain sticky and retain their counted bytes. */
    settleRetirements: async (): Promise<void> => {
      while (retirements.size !== 0)
        await createAutoMovieResourceRetirement(
          [...retirements].map((retirement) => retirement.failure === undefined
            ? () => retirement.completion
            : createAutoMovieResourceRetirement([], retirement.failure)),
        )();
    },
    /** Selected plus pending or failed retirement array bytes; not a physical GPU or collection reading. */
    total: (): number => total + retiringBytes,
  };
}

/**
 * One withdrawn cache entry whose array accounting stays until its actual
 * owner settles successfully. Failure remains an original value, not a new
 * successful completion or evidence of physical release.
 *
 * @evidence contracts/common.md#principled-implementation Keeps measured array bytes paired with the real retirement promise and its independently observed original rejection.
 * @evidence contracts/common.md#clear-and-simple-design The cache-local record describes one withdrawn owner without a separate service or global lifetime registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A recorded rejection stays available to settlement and cannot be counted as successful release.
 * @evidence contracts/common.md#meaningful-documentation States byte units, actual promise ownership and the absence meaning of an unobserved failure.
 * @author Samchon
 */
interface IHumanViewerCacheRetirement<Value> {
  /** Actual withdrawn owner, kept while pending or failed instead of relying on settled Promise internals. */
  value: Value;

  /** The removed entry's counted array bytes, retained while pending or failed. */
  bytes: number;

  /** Original retirement completion; rejection is retained for the awaiting consumer. */
  completion: Promise<void>;

  /** Observed original rejection; omission means no failure has yet been recorded. */
  failure?: { error: unknown };
}
