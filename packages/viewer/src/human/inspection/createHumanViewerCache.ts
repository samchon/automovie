import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";

/**
 * Resident LRU bounded by size. Each entry reports its size once, when it is stored; after a store the least recently used entries are withdrawn until the selected total fits the budget again. The entry just stored is never released by its own store, so one document larger than the whole budget can still be drawn, alone. Reads move entries to the newest position; eviction and clearing start owned retirement once. Selection stays synchronous, but callers await settlement before treating release as completed. Pending and failed retirement retain their counted bytes and original failure; withdrawal is not physical release. Counted array bytes do not quantify GPU allocation or prove collection. The caller supplies digest keys, the size function and a disposer, so the same policy owns numerical and GPU residents. A failed build is never inserted by the caller.
 *
 * @evidence contracts/common.md#principled-implementation Map insertion order implements LRU selection; counted sizes drive eviction while each withdrawn owner keeps its original retirement completion and failure.
 * @evidence contracts/common.md#clear-and-simple-design Selected entries, their sizes and pending retirements have distinct maps and accounting, so withdrawal cannot masquerade as physical release.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sizes and budget must be finite and valid; failed disposal remains visible to settlement and total, and a single oversized current entry is explicitly allowed.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes array accounting, selected state, settlement, oversized entries and the absence of GPU or garbage-collection measurement.
 * @evidence contracts/performance.md#efficient-algorithms Hits use expected constant-time map operations; insertion evicts each necessary oldest entry once, while clear and settlement traverse selected and retiring owners respectively.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller owns digest-key equivalence; hits move the same resident without copying it, and replacing a key with that same value avoids duplicate retirement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Selected counted bytes fit the budget except one oversized current entry; zero-byte entries have no count cap, and pending or failed retirements retain owners and bytes until successful settlement or server teardown.
 */
export function createHumanViewerCache<Value>(
  budget: number,
  size: (value: Value) => number,
  dispose: ((value: Value) => void) | ((value: Value) => Promise<void>),
): {
  get: (key: string) => Value | undefined;
  set: (key: string, value: Value) => void;
  clear: () => void;
  evictOldest: (keep: string) => boolean;
  keys: () => string[];
  settleRetirements: () => Promise<void>;
  total: () => number;
} {
  if (!Number.isFinite(budget) || budget <= 0)
    throw new Error("Cache budget must be a positive finite size");
  const entries: Map<string, Value> = new Map();
  const sizes: Map<string, number> = new Map();
  const retirements: Set<IHumanViewerCacheRetirement<Value>> = new Set();
  let total: number = 0;
  let retiringBytes: number = 0;
  const retire: (value: Value, bytes: number) => void = (value: Value, bytes: number): void => {
    retiringBytes += bytes;
    const completion: Promise<void> = createAutoMovieResourceRetirement([async (): Promise<void> => {
      await dispose(value);
    }])();
    const retirement: IHumanViewerCacheRetirement<Value> = { value, bytes, completion };
    retirements.add(retirement);
    void completion.then((): void => {
      retirements.delete(retirement);
      retiringBytes -= bytes;
    }).catch((error: unknown): void => {
      retirement.failure = { error };
    });
  };
  const remove: (key: string) => void = (key: string): void => {
    const value: Value = entries.get(key)!;
    const bytes: number = sizes.get(key)!;
    total -= bytes;
    entries.delete(key);
    sizes.delete(key);
    retire(value, bytes);
  };
  return {
    get: (key: string): Value | undefined => {
      if (!entries.has(key)) return undefined;
      const value: Value = entries.get(key)!;
      const bytes: number = sizes.get(key)!;
      entries.delete(key);
      sizes.delete(key);
      entries.set(key, value);
      sizes.set(key, bytes);
      return value;
    },
    set: (key: string, value: Value): void => {
      const bytes: number = size(value);
      if (!Number.isFinite(bytes) || bytes < 0)
        throw new Error(
          "A cache entry size must be a finite nonnegative number",
        );
      if (entries.has(key)) {
        const previous: Value = entries.get(key)!;
        const previousBytes: number = sizes.get(key)!;
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
          [...retirements].map((retirement: IHumanViewerCacheRetirement<Value>): (() => Promise<void>) => retirement.failure === undefined
            ? (): Promise<void> => retirement.completion
            : createAutoMovieResourceRetirement([], retirement.failure)),
        )();
    },
    /** Selected plus pending or failed retirement array bytes; not a physical GPU or collection reading. */
    total: (): number => total + retiringBytes,
  };
}

/**
 * One withdrawn cache entry whose array accounting stays until its actual owner settles successfully. Failure remains an original value, not a new successful completion or evidence of physical release.
 *
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
