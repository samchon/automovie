import type { IAutoMovieRecoverySlabConnectivityGroup } from "./IAutoMovieRecoverySlabConnectivityGroup";

/**
 * Callable observation and preparation forms for connected source support
 * between two cuts.
 */

export namespace IAutoMovieRecoverySlabGraph {
  /**
   * Group supplied boundary loops by connected source incidence in one open
   * scalar slab. Supply aligned input triangle IDs, canonical vertices, finite
   * heights and increasing bounds. Keep unresolved groups when a support has no
   * unique component.
   */

  export type Observe = (input: {
    /** Original source triangle vertex ordinals in input face order. */
    triangles: readonly [number, number, number][];

    /**
     * Original-to-canonical vertex addresses used for clipped edge and vertex
     * incidence.
     */
    canon: Int32Array;

    /**
     * Finite source scalar heights in millimetres, aligned with the original
     * vertices.
     */
    heights: readonly number[];

    /** Finite lower scalar bound in millimetres, strictly below afterMm. */
    beforeMm: number;

    /** Finite upper scalar bound in millimetres. */
    afterMm: number;

    /** Original-face support sets for lower boundary loops, in caller order. */
    before: readonly ReadonlySet<number>[];

    /** Original-face support sets for upper boundary loops, in caller order. */
    after: readonly ReadonlySet<number>[];

    /** Original-face sets for unrepresented or defective source incidence. */
    defects: readonly ReadonlySet<number>[];

    /**
     * Optional increasing original face addresses containing every face that
     * crosses the open scalar interval. Omission scans all faces.
     */
    candidates?: readonly number[];

    /**
     * Optional private original-face support sets whose positions can be
     * associated with groups.
     */
    probes?: readonly ReadonlySet<number>[];
  }) => IAutoMovieRecoverySlabConnectivityGroup[];

  /**
   * Prepare aligned source triangles, vertex aliases and finite scalar heights
   * once for repeated open-slab queries. Keep those arrays unchanged and supply
   * source face addresses for all query supports.
   */

  export type Prepare = (source: {
    /** Original source triangle vertex ordinals, kept unchanged for every query. */
    triangles: readonly [number, number, number][];

    /** Original-to-canonical vertex addresses held by the prepared source. */
    canon: Int32Array;

    /**
     * Finite signed scalar positions in millimetres, aligned with the source
     * vertices.
     */
    heights: readonly number[];
  }) => (
    input: Omit<
      Parameters<IAutoMovieRecoverySlabGraph.Observe>[0],
      "triangles" | "canon" | "heights"
    >,
  ) => IAutoMovieRecoverySlabConnectivityGroup[];
}
