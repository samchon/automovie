import { IAutoMovieSurfaceSample } from "./IAutoMovieSurfaceSample";

/**
 * The vertices of a surface rig by identity, each with the writer that
 * evaluates it per pose, from `registerAutoMovieSurfaceVertices`. Registration,
 * binding and finalization are allowed only before finalization; afterward only
 * count, identity lookup and the resolved writers remain usable. A binding
 * failure leaves the registry terminal and releases its compile-only records.
 *
 * @evidence contracts/common.md#principled-implementation Vertices welded by exact identity, each bound once to the evaluation that places it.
 * @evidence contracts/common.md#clear-and-simple-design One map from identity to index and one ordered list of writers, which runs in dependency order because a vertex is registered after everything it reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is welded by distance; `existing` refuses an identity no patch made.
 * @evidence contracts/common.md#meaningful-documentation States the identity rule, the writer order and the finalization of sweep points.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are on its producer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record; it is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record owned by its rig.
 * @author Samchon
 */
export interface IAutoMovieSurfaceRegistry {
  /** Writers in registration order, each filling its vertices into a target buffer. */
  writers: Array<(targets: Float64Array) => void>;

  /**
   * Number of vertices registered so far.
   *
   * @returns The count
   *
   * @evidence contracts/common.md#principled-implementation The number of vertices welded so far.
   * @evidence contracts/common.md#clear-and-simple-design One read.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is counted twice.
   * @evidence contracts/common.md#meaningful-documentation States what is counted.
   * @evidence contracts/performance.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  count(): number;

  /**
   * Register a vertex whose writer the caller adds, such as a blend's interior.
   *
   * @param key Identity, not yet registered
   * @returns Its index
   *
   * @evidence contracts/common.md#principled-implementation Registers a vertex whose evaluation the caller owns.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The key must be new; callers reserve only unique blend keys.
   * @evidence contracts/common.md#meaningful-documentation States the premise.
   * @evidence contracts/performance.md#efficient-algorithms One map write.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  reserve(key: string): number;

  /**
   * Register a point by identity, making its writer only when it is new.
   *
   * @param key Identity
   * @param make Makes the point's writer
   * @returns Its index
   *
   * @evidence contracts/common.md#principled-implementation Welds a point by identity and binds its writer once.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Points are never welded by distance.
   * @evidence contracts/common.md#meaningful-documentation States when the writer is made.
   * @evidence contracts/performance.md#efficient-algorithms One map read, and a write when new.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  vertex(
    key: string,
    make: () => (out: Float64Array, at: number) => void,
  ): number;

  /**
   * Register a sampled point: a sweep point narrows its cell by the spacing this sampling reports, any other point is registered as `vertex` does.
   *
   * @param sample The sample
   * @returns Its index
   *
   * @evidence contracts/common.md#principled-implementation Welds a sampled point, narrowing a sweep point's cell.
   * @evidence contracts/common.md#clear-and-simple-design One call per sampling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A sweep point's cell does not depend on which patch came first.
   * @evidence contracts/common.md#meaningful-documentation States both kinds of point.
   * @evidence contracts/performance.md#efficient-algorithms One map read and a constant-size update.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  admit(sample: IAutoMovieSurfaceSample): number;

  /**
   * Resolve every sweep writer from its finest reported spacing, mirror missing sides and zero wholly unreached axes, then run dependent bindings before sweep sealing. Registration and repeated finalization are refused afterward; temporary records are cleared even if a binding throws.
   *
   * @evidence contracts/common.md#principled-implementation Makes each sweep point's writer from its final cell.
   * @evidence contracts/common.md#clear-and-simple-design One call after all patches.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A side no sampling reached mirrors the other rather than defaulting.
   * @evidence contracts/common.md#meaningful-documentation States the mirror and zero rules.
   * @evidence contracts/performance.md#efficient-algorithms O(S + D) bookkeeping for S sweep samples and D dependent bindings, plus their surface-sample and probe compilation queries.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  finalize(): void;

  /**
   * Bind a dependent evaluator after every sweep cell has been resolved, before the sweep rigs are sealed.
   *
   * The callback receives the geometric writer and cell, independent of pinned cage controls. An identity not registered as a sweep sample receives null; an observational node then keeps its raw zero-cell meaning. The callback runs once during finalize and may register sweep samples or probes, but cannot add registry entries.
   *
   * @param key Exact shared sample identity
   * @param bind One-time compile callback; its reference is released after finalization, including failure
   * @throws Error if the registry has been finalized
   *
   * @evidence contracts/common.md#principled-implementation Resolves dependent geometric evaluators only after all patch sides have contributed their sampling reaches.
   * @evidence contracts/common.md#clear-and-simple-design One compile callback binds a direct writer or probe slot; no per-pose registry lookup is required.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads the resolved sweep field, never a pin-overwritten target buffer; unknown observation-only identities stay distinct.
   * @evidence contracts/common.md#meaningful-documentation States the callback phase, null meaning, ownership, failure lifetime and legal registration boundary.
   * @evidence contracts/performance.md#efficient-algorithms Constant-time request registration and one identity lookup during finalization.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; the producer owns finalization and field sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The producer clears compile-only callbacks; dependent writers belong to their owning rig.
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
   *
   * @evidence contracts/common.md#principled-implementation Looks up a welded identity.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An identity no patch made is refused.
   * @evidence contracts/common.md#meaningful-documentation States the refusal.
   * @evidence contracts/performance.md#efficient-algorithms One map read.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  existing(key: string, what: string): number;
}

/** Resolved geometric sweep samples supplied only during registry finalization. */
export namespace IAutoMovieSurfaceRegistry {
  /**
   * One geometric sample and its resolved parameter-space footprint, before any cage control pin.
   *
   * @evidence contracts/common.md#principled-implementation The same sweep writer and resolved cell used by the emitted shared sample.
   * @evidence contracts/common.md#clear-and-simple-design A writer and four scalar reaches; callers bind them once during compilation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries geometric field data rather than a mutable target-buffer lookup.
   * @evidence contracts/common.md#meaningful-documentation States units, stage and finalization-only delivery.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record whose producer performs resolution.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared by the emitted vertex and dependent geometric node writers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Sample writers are owned by their rig; the registry clears its compile map.
   * @author Samchon
   */
  export interface ISweep {
    /** Exact registered sweep coordinate along the spine, before identity rounding; probes differentiate at this coordinate. */
    readonly u: number;

    /** Exact registered angular coordinate in turns, before identity rounding. */
    readonly v: number;

    /** Spacing below/above along u, then below/above along v, finite and nonnegative; missing sides have been mirrored and wholly unreached axes are zero. */
    readonly cell: readonly [number, number, number, number];

    /**
     * Write three geometric coordinates in network-frame metres for the current
     * pose, before control pins. The caller supplies three writable slots at
     * the scalar offset at; the output buffer is not retained. The owning rig
     * refreshes frames and scales before pose or girth evaluation reads this.
     *
     * @evidence contracts/common.md#principled-implementation Applies the compiled resolved-footprint radius quadrature, one to three longitudinal terms, in the sweep frame with the current rig scales; the footprint remains fixed while the pose and girth field refresh their frames and scales.
     * @evidence contracts/common.md#clear-and-simple-design A direct geometric writer is shared by the emitted sample and its dependent curve endpoint; neither reads a pin-overwritten target slot or performs a registry lookup per pose.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Writes the actual resolved geometric field before control pinning, not a substituted displayed endpoint or cached value from another pose.
     * @evidence contracts/common.md#meaningful-documentation States the network frame and metre units, output offset and capacity premise, current-pose meaning, pre-pin stage and output-buffer ownership.
     * @evidence contracts/performance.md#efficient-algorithms Each call accumulates at most three compiled scale terms and writes three coordinates; profile quadrature and coefficients were prepared when sample compiled, with no per-write allocation.
     * @evidence contracts/performance.md#reuse-equivalent-work Emitted and dependent samples share the compiled writer, coefficients and rig frame/scale slots. Calls reevaluate those terms rather than claiming one cached coordinate evaluation across changing poses or output buffers.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The writer closure belongs to its sweep rig and retains at most three coefficient/slot entries plus a frame index; it retains no supplied output buffer, and registry compile-only references are cleared after finalization.
     */
    readonly write: (out: Float64Array, at: number) => void;
  }
}

