/** Bounded memoization of exact unsigned base-radius queries within one epoch. */
export namespace AutoMovieHumanRadiusEpoch {
  /** Radius cache whose key excludes all signed skin and appearance state. */
  export interface ICache {
    /** Drop every geometry value before a construction epoch is rebuilt. */
    beginEpoch(): void;
    /**
     * Read only the raw symmetric radius. Owner is the immutable mandible
     * identity, including undefined before that mandible has been constructed.
     */
    read(owner: object | undefined, station: number, origin: number, angle: number, guess: number, compute: () => number): number;
    /** Current retained entries, never more than the supplied resource capacity. */
    size(): number;
  }

  /** Round-trip numerical identity, including distinct signed zero keys. */
  function key(value: number): string { return Object.is(value, -0) ? "-0" : String(value); }

  /**
   * Prepare one bounded cache for one head construction, not a global figure
   * cache. Capacity affects reuse and memory only. Finite input tuples are
   * keyed exactly without bins, tolerances or angular/station quantization.
   * All nonfinite computations remain observable and are never memoized.
   */
  export function create(maximumEntries: number): ICache {
    if (!(Number.isInteger(maximumEntries) && maximumEntries > 0)) throw new Error("Radius memoization requires a positive resource capacity.");
    let owners: WeakMap<object, number> = new WeakMap();
    let ownerSequence: number = 0;
    const entries: Map<string, number> = new Map();
    return {
      /** Invalidate both numerical results and scope identities before rebuilding. */
      beginEpoch(): void { entries.clear(); owners = new WeakMap(); ownerSequence = 0; },
      /** Reuse only an identical raw-radius query under the same geometry owner. */
      read(owner: object | undefined, station: number, origin: number, angle: number, guess: number, compute: () => number): number {
        if (![station, origin, angle, guess].every(Number.isFinite)) return compute();
        let id: number = 0;
        if (owner !== undefined) {
          const known: number | undefined = owners.get(owner);
          if (known === undefined) { id = ++ownerSequence; owners.set(owner, id); }
          else id = known;
        }
        const address: string = `${id}|${key(station)}|${key(origin)}|${key(angle)}|${key(guess)}`;
        const known: number | undefined = entries.get(address);
        if (known !== undefined) {
          entries.delete(address);
          entries.set(address, known);
          return known;
        }
        const value: number = compute();
        if (Number.isFinite(value)) {
          if (entries.size >= maximumEntries) entries.delete(entries.keys().next().value!);
          entries.set(address, value);
        }
        return value;
      },
      /** Retained-entry count for bounded resource evidence. */
      size(): number { return entries.size; },
    };
  }
}
