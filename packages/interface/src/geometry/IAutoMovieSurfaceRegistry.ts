import type { IAutoMovieSurfaceSample } from "./IAutoMovieSurfaceSample";

/**
 * The vertices of a surface rig by identity, each with the writer that
 * evaluates it per pose, from `registerAutoMovieSurfaceVertices`. Registration,
 * binding and finalization are allowed only before finalization; afterward only
 * count, identity lookup and the resolved writers remain usable. A binding
 * failure leaves the registry terminal and releases its compile-only records.
 */
export interface IAutoMovieSurfaceRegistry {
  /**
   * Writers in registration order, each filling its vertices into a target
   * buffer.
   */
  writers: Array<(targets: Float64Array) => void>;

  /**
   * Number of vertices registered so far.
   *
   * @returns The count
   */
  count(): number;

  /**
   * Register a vertex whose writer the caller adds, such as a blend's interior.
   *
   * @param key Identity, not yet registered
   * @returns Its index
   */
  reserve(key: string): number;

  /**
   * Register a point by identity, making its writer only when it is new.
   *
   * @param key Identity
   * @param make Makes the point's writer
   * @returns Its index
   */
  vertex(
    key: string,
    make: () => (out: Float64Array, at: number) => void,
  ): number;

  /**
   * Register a sampled point: a sweep point narrows its cell by the spacing
   * this sampling reports, any other point is registered as `vertex` does.
   *
   * @param sample The sample
   * @returns Its index
   */
  admit(sample: IAutoMovieSurfaceSample): number;

  /**
   * Resolve every sweep writer from its finest reported spacing, mirror missing
   * sides and zero wholly unreached axes, then run dependent bindings before
   * sweep sealing. Registration and repeated finalization are refused
   * afterward; temporary records are cleared even if a binding throws.
   */
  finalize(): void;

  /**
   * Bind a dependent evaluator after every sweep cell has been resolved, before
   * the sweep rigs are sealed.
   *
   * The callback receives the geometric writer and cell, independent of pinned
   * cage controls. An identity not registered as a sweep sample receives null;
   * an observational node then keeps its raw zero-cell meaning. The callback
   * runs once during finalize and may register sweep samples or probes, but
   * cannot add registry entries.
   *
   * @param key Exact shared sample identity
   * @param bind One-time compile callback; its reference is released after
   *   finalization, including failure
   * @throws Error if the registry has been finalized
   */
  bindSweep(
    key: string,
    bind: (sample: IAutoMovieSurfaceRegistry.ISweep | null) => void,
  ): void;

  /**
   * Index of a registered identity.
   *
   * @param key Identity
   * @param what What names it, for the diagnostic
   * @returns Its index
   * @throws Error when no patch made it
   */
  existing(key: string, what: string): number;
}

/** Data and callback contracts shared by the SurfaceRegistry operations. */
export namespace IAutoMovieSurfaceRegistry {
  /**
   * One geometric sample and its resolved parameter-space footprint, before any
   * cage control pin.
   */
  export interface ISweep {
    /**
     * Exact registered sweep coordinate along the spine, before identity
     * rounding; probes differentiate at this coordinate.
     */
    readonly u: number;

    /** Exact registered angular coordinate in turns, before identity rounding. */
    readonly v: number;

    /**
     * Spacing below/above along u, then below/above along v, finite and
     * nonnegative; missing sides have been mirrored and wholly unreached axes
     * are zero.
     */
    readonly cell: readonly [number, number, number, number];

    /**
     * Write three geometric coordinates in network-frame metres for the current
     * pose, before control pins. The caller supplies three writable slots at
     * the scalar offset at; the output buffer is not retained. The owning rig
     * refreshes frames and scales before pose or girth evaluation reads this.
     */
    readonly write: (out: Float64Array, at: number) => void;
  }
}
