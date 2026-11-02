/** Bounded caches preserve exact keys and never interpolate geometry. */
export namespace AutoMovieHumanHeadCranialExactCache {
  /** Exact least-recently-used storage; capacity is a memory budget only. */
  export class Lru<K, V> {
    /** Actual retained values in access order. */
    private values: Map<K, V> = new Map();
    /** Set a positive integer memory budget, independent of figure resolution. */
    private capacity: number;
    /** Set a positive integer memory budget, independent of figure resolution. */
    public constructor(capacity: number) {
      if (!(Number.isInteger(capacity) && capacity > 0)) throw new Error("An exact cache needs a positive integer entry budget.");
      this.capacity = capacity;
    }
    /** Number of currently retained exact values. */
    public get size(): number { return this.values.size; }
    /** Get only an exactly identical key and refresh its eviction order. */
    public get(key: K): V | undefined {
      const found: V | undefined = this.values.get(key);
      if (found !== undefined) { this.values.delete(key); this.values.set(key, found); }
      return found;
    }
    /** Retain the exact value and evict the least-recently-used entry if full. */
    public set(key: K, value: V): void {
      this.values.delete(key);
      if (this.values.size >= this.capacity) this.values.delete(this.values.keys().next().value!);
      this.values.set(key, value);
    }
    /** Drop all values when their source geometry or coefficient changes. */
    public clear(): void { this.values.clear(); }
  }
}
