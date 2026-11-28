import type { IAutoMovieRecoveryOpenArcIncidence } from "./IAutoMovieRecoveryOpenArcIncidence";

/** Source-backed queries for open-arc transport across one physical slab. */

export namespace IAutoMovieRecoveryOpenSlabGraph {
  /** Qualified open-arc pairs and separate unresolved source-incidence findings. */
  export interface Result {
    /**
     * Qualified one-to-one arcs in before- and after-array order, with reversal
     * when endpoints exchange.
     */
    pairs: {
      /** Original index in the query's lower arc array. */
      before: number;
      /** Original index in the query's upper arc array. */
      after: number;
      /**
       * Whether the upper arc's observed endpoint order reverses across the two
       * boundary paths.
       */
      reverseAfter: boolean;
    }[];

    /** Original arc positions and reason for each unsupported component. */
    unresolved: {
      /** Original lower arc positions with unresolved transport, possibly empty. */
      before: number[];
      /** Original upper arc positions with unresolved transport, possibly empty. */
      after: number[];
      /**
       * Reason the observed sheet or endpoint paths could not support an
       * ordinary pair.
       */
      reason: string;
    }[];

    /** Source material orientation warnings observed on candidate faces. */
    diagnostics?: string[];
  }

  /**
   * Position, scalar and incidence arrays for preparing repeated open slab
   * queries.
   */
  export interface Source {
    /** Registered Cartesian source vertices in input ordinal order. */
    vertices: readonly [number, number, number][];

    /** Three original vertex indices per source triangle. */
    triangles: readonly [number, number, number][];

    /** Original-to-canonical vertex map for exact allowed aliases. */
    canon: Int32Array;

    /**
     * Finite scalar heights in millimetres at the corresponding source
     * vertices.
     */
    heights: readonly number[];
  }

  /**
   * One increasing physical interval with admitted arc supports and candidate
   * source faces.
   */
  export interface Query {
    /** Lower signed scalar station in millimetres. */
    beforeMm: number;

    /** Upper signed scalar station in millimetres. */
    afterMm: number;

    /** Open-arc incidence records on the lower cut, in query ordinal order. */
    before: readonly IAutoMovieRecoveryOpenArcIncidence[];

    /** Open-arc incidence records on the upper cut, in query ordinal order. */
    after: readonly IAutoMovieRecoveryOpenArcIncidence[];

    /**
     * Original face sets for unrepresented contacts or defective source
     * regions.
     */
    defects: readonly ReadonlySet<number>[];

    /** Original source face ordinals selected for the physical slab. */
    candidates: readonly number[];
  }
  /**
   * Prepare source incidence once, then query ordinary open-arc transport over
   * supplied physical slab bounds.
   */
  export type Prepare = (source: Source) => (input: Query) => Result;
}
