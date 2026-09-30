/**
 * Bounded resident LRU. Reads move entries to the newest position; eviction and
 * clearing release owned resources exactly once. The caller supplies digest
 * keys and a disposer, so the same policy owns numerical and GPU residents.
 * A failed build is never inserted by the caller.
 *
 * @evidence contracts/common.md#principled-implementation Map insertion order represents least-to-most-recent use and releases each evicted owner.
 * @evidence contracts/common.md#clear-and-simple-design Capacity and disposal are explicit inputs; key computation stays with provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The eviction policy treats every document identically.
 * @evidence contracts/common.md#meaningful-documentation Describes recency, lifetime ownership and failed-build admission.
 */
export function createHumanViewerCache<Value>(capacity: number, dispose: (value: Value) => void) {
  if (!Number.isInteger(capacity) || capacity < 1) throw new Error("Cache capacity must be a positive integer");
  const entries = new Map<string, Value>();
  return {
    get: (key: string): Value | undefined => {
      if (!entries.has(key)) return undefined;
      const value = entries.get(key)!;
      entries.delete(key);
      entries.set(key, value);
      return value;
    },
    set: (key: string, value: Value): void => {
      if (entries.has(key)) {
        const previous = entries.get(key)!;
        if (previous !== value) dispose(previous);
        entries.delete(key);
      }
      entries.set(key, value);
      if (entries.size > capacity) {
        const oldest = entries.keys().next().value!;
        const previous = entries.get(oldest)!;
        entries.delete(oldest);
        dispose(previous);
      }
    },
    clear: (): void => {
      for (const value of entries.values()) dispose(value);
      entries.clear();
    },
    keys: (): string[] => [...entries.keys()],
  };
}
