import type { IAutoMovieCanonicalBoundaryPhase64 } from "./IAutoMovieCanonicalBoundaryPhase64";

/**
 * Exact normalized boundary addresses and directed interval incidence.
 * AutoMovieEngineCanonicalBoundary64 admits finite phases in [0,1], distinct interval
 * endpoints and unique use IDs. Authority identity is declared independently of
 * numeric position. Inversion borrows its monotone map and anchors; partition
 * returns new atom arrays and diagnostics.
 */
export namespace IAutoMovieCanonicalBoundary64 {
  /**
   * One authority's directed normalized interval; finite endpoints lie in [0,1]
   * and differ. Authority is a caller-owned identity, not a position.
   */
  export type Interval = {
    /** Caller-owned boundary identity, independent of numeric coincidence. */
    authority: string;

    /** Finite initial canonical phase in [0,1]; directed order is preserved. */
    start: number;

    /** Finite terminal canonical phase in [0,1], distinct from start. */
    end: number;
  };

  /**
   * Authored anchors for inversion of a finite monotone canonical-phase map.
   * Anchors include local 0 and 1 in increasing local order; their exact phases
   * are strictly directed. Exact authored addresses retain their original
   * local. Foreign phases are bracketed by those anchors and bisected in
   * ordered positive binary64 bits until an exact hit or adjacent representable
   * locals remain. An unattainable phase returns an interior bracketing local,
   * with its original canonical identity retained by the caller. No continuous
   * inverse is certified. A local reversal against the anchor direction,
   * inconsistent anchor, out-of-range target or unrepresentable interior
   * inverse throws rather than moving an authored local coordinate.
   */
  export type IInverseAnchors = readonly {
    /**
     * Authored local coordinate in [0,1]. Entries increase strictly, include
     * both endpoints, and retain their exact original coordinates when
     * inverted.
     */
    local: number;
    /**
     * Exact canonical address produced by the supplied map at local. Anchor
     * phases are strictly increasing or strictly decreasing; inconsistent
     * values or a local reversal against that direction throw.
     */
    phase: IAutoMovieCanonicalBoundaryPhase64;
  }[];

  /**
   * Declared uses partitioned at each named authority's binary64 endpoints.
   * Partition returns increasing open atoms sorted by authority and start, with
   * sorted incident IDs. Input walk is the patch's coherent boundary walk
   * relative to increasing local side parameter (+1 bottom/right, -1 top/left).
   * Output walks multiply that sign by sign(end-start), so all use the
   * increasing canonical atom direction. Empty coverage and
   * conflicting/overfull incidence remain explicit diagnostics; they neither
   * throw nor certify source topology. Three global uses can describe
   * coarse1+fine2 with exactly two uses per atom. Duplicate IDs, empty
   * authority/ID, invalid walks and invalid intervals throw.
   */
  export type IPartitionUses = readonly {
    /**
     * Use identifier unique across the entire input list; duplicate IDs throw
     * even under different authorities.
     */
    id: string;
    /**
     * Caller-declared boundary identity. Only uses with this exact string share
     * a partition.
     */
    authority: string;
    /**
     * Directed initial canonical coordinate, finite in [0,1] and distinct from
     * end.
     */
    start: number;
    /**
     * Directed final canonical coordinate, finite in [0,1]; may be less than
     * start to reverse the restriction.
     */
    end: number;
    /**
     * Coherent patch traversal relative to increasing local side parameter: +1
     * for bottom/right and -1 for top/left in the atlas convention. Partition
     * multiplies it by the restriction direction.
     */
    walk: 1 | -1;
  }[];

  /**
   * Owned atom coverage and diagnostics after partitioning admitted declared
   * uses. Atoms cover the span between each authority's extreme declared
   * endpoints; phases outside that span are not reported as uncovered. Endpoint
   * points do not contribute open-atom incidence. Returned records and arrays
   * are new.
   */
  export type IPartitionResult = {
    /**
     * New increasing open intervals between successive declared endpoints,
     * sorted lexically by authority then numerically by start. Gaps inside the
     * declared endpoint span remain atoms with no uses; an empty input yields
     * no atoms.
     */
    atoms: {
      /** Exact authority string shared by this atom's incidence group. */
      authority: string;
      /**
       * Lower normalized endpoint of the open atom; finite in [0,1] and
       * strictly below end.
       */
      start: number;
      /**
       * Upper normalized endpoint of the open atom; endpoints themselves do not
       * contribute point incidence.
       */
      end: number;
      /**
       * Lexically sorted IDs whose directed restrictions cover this open atom.
       * Empty means uncovered, and more than two means overfull declared
       * incidence.
       */
      uses: string[];
      /**
       * One sign per uses entry, aligned by index and expressed relative to
       * increasing canonical phase. Two equal signs produce a
       * direction-conflict diagnostic.
       */
      walks: (1 | -1)[];
    }[];
    /**
     * Uncovered, overfull or equal-walk atom reports. Empty means these
     * declared-incidence checks passed; it does not certify geometric embedding
     * or source topology.
     */
    diagnostics: string[];
  };
}
