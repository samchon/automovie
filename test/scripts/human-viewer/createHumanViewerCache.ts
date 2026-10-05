/**
 * Resident LRU bounded by size. Each entry reports its size once, when it is
 * stored; after a store the least recently used entries are released until the
 * total fits the budget again. The entry just stored is never released by its
 * own store, so one document larger than the whole budget can still be drawn,
 * alone. Reads move entries to the newest position; eviction and clearing
 * release owned resources exactly once. The caller supplies digest keys, the
 * size function and a disposer, so the same policy owns numerical and GPU
 * residents. A failed build is never inserted by the caller.
 *
 * @evidence contracts/common.md#principled-implementation Bounds what the page keeps alive by the measured size of each entry, not by how many documents it holds.
 * @evidence contracts/common.md#clear-and-simple-design Budget, size and disposal are explicit inputs; key computation stays with provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The eviction policy treats every document identically.
 * @evidence contracts/common.md#meaningful-documentation Describes recency, the size bound, the oversize case and lifetime ownership.
 */
export function createHumanViewerCache<Value>(
  budget: number,
  size: (value: Value) => number,
  dispose: (value: Value) => void,
) {
  if (!Number.isFinite(budget) || budget <= 0)
    throw new Error("Cache budget must be a positive finite size");
  const entries = new Map<string, Value>();
  const sizes = new Map<string, number>();
  let total = 0;
  const remove = (key: string): void => {
    const value = entries.get(key)!;
    total -= sizes.get(key)!;
    entries.delete(key);
    sizes.delete(key);
    dispose(value);
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
        throw new Error("A cache entry size must be a finite nonnegative number");
      if (entries.has(key)) {
        const previous = entries.get(key)!;
        total -= sizes.get(key)!;
        entries.delete(key);
        sizes.delete(key);
        if (previous !== value) dispose(previous);
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
      for (const value of entries.values()) dispose(value);
      entries.clear();
      sizes.clear();
      total = 0;
    },
    /** Release the least recently used entry other than `keep`; false when no other entry is left. */
    evictOldest: (keep: string): boolean => {
      for (const oldest of entries.keys()) {
        if (oldest === keep) continue;
        remove(oldest);
        return true;
      }
      return false;
    },
    keys: (): string[] => [...entries.keys()],
    /** Sum of the stored entries' sizes. */
    total: (): number => total,
  };
}
