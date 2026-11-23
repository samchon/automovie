import type { IAutoMovieRecoveryOpenArcIncidence } from "./IAutoMovieRecoveryOpenArcIncidence";

/** Observe ordinary open-arc transport without exporting source addresses. */

export namespace IAutoMovieRecoveryOpenSlabGraph {
  /** Source-independent ordinary pairs and explicit local omissions. */
  export interface Result {
    /**
     * Ordinary local arc correspondence; reversal is relative to both saved
     * directions.
     */
    pairs: {
      /** Saved before-side arc or observation ordinal in the addressed section. */
      before: number;
      /** Saved after-side arc or observation ordinal in the addressed section. */
      after: number;
      /**
       * Whether the after-side continuation must reverse its saved endpoint
       * order.
       */
      reverseAfter: boolean;
    }[];

    /**
     * Unsupported components, including components without represented boundary
     * arcs.
     */
    unresolved: {
      /**
       * Original before-side boundary observations or their source-face
       * support, retaining the supplied side order.
       */
      before: number[];
      /**
       * Original after-side boundary observations or their source-face support,
       * retaining the supplied side order.
       */
      after: number[];
      /**
       * Actual termination or qualification reason; null, where allowed, means
       * no local failure was recorded.
       */
      reason: string;
    }[];

    /**
     * Source orientation warnings do not remove otherwise valid undirected
     * topology.
     */
    diagnostics?: string[];
  }

  /** Immutable source retained only by the preparation closure. */
  export interface Source {
    /** Original finite millimetre positions; never returned. */
    vertices: readonly [number, number, number][];

    /** Original oriented triangles; undirected incidence owns topology. */
    triangles: readonly [number, number, number][];

    /** Idempotent exact-coordinate/height canonical source addresses. */
    canon: Int32Array;

    /** Fixed finite scalar chart, in millimetres, aligned with positions. */
    heights: readonly number[];
  }

  /** One open slab's real arcs, explicit defects and complete candidates. */
  export interface Query {
    /** Finite increasing physical section coordinates, in millimetres. */
    beforeMm: number;

    /** Upper physical section coordinate, in millimetres. */
    afterMm: number;

    /** Real saved open arcs on the lower cut, in publication order. */
    before: readonly IAutoMovieRecoveryOpenArcIncidence[];

    /** Real saved open arcs on the upper cut, in publication order. */
    after: readonly IAutoMovieRecoveryOpenArcIncidence[];

    /**
     * Closed/isolated/unrepresented supports and every critical-event face in
     * this slab.
     */
    defects: readonly ReadonlySet<number>[];

    /** Complete strict-overlap original face IDs, in increasing order. */
    candidates: readonly number[];
  }
  /**
   * Prepare source boundary incidence once, then answer ordinary open-arc
   * transport queries against that unchanged source. The returned synchronous
   * query retains source incidence until released; unsupported local transport
   * is recorded in Result rather than fabricated.
   */
  export type Prepare = (source: Source) => (input: Query) => Result;
}
