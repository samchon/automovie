import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoverySourceLineage,
} from "..";

/**
 * Ordered raw plane-cut contour with exact source segment lineage. Point and
 * cumulative lengths are registered millimetres; edge fractions are
 * dimensionless and source triangle/edge ordinals address the original
 * observation input. Contour order includes open, closed and unsupported
 * publications.
 */
export interface IAutoMovieRecoveryOrderedContour {
  /** Raw ordinal before fitting or rejection, in this saved physical plane. */
  contourIndex: number;

  /** Closure follows the exact cutter's graph walk, never an invented cap. */
  closed: boolean;

  /**
   * Original closed/open/failed/degenerate publication, preserved independently
   * of new traces.
   */
  publication: IAutoMovieRecoverySourceLineage["publication"];

  /**
   * Broad original face support, including incident neighbors; not exact
   * emitting membership.
   */
  sourceTriangleIds: number[];

  /** Original faces that actually emitted this contour or isolated contact. */
  exactSourceTriangleIds: number[];

  /**
   * Ordered registered observations; p and each witness point are mm, t is
   * dimensionless.
   */
  points: Array<{
    /**
     * Physical point selected by the existing canonical cutter, not a
     * representative vertex interpolation.
     */
    p: Readonly<AutoMovieVector3Tuple>;

    /**
     * First canonical connectivity label of the cutter point's supporting edge
     * or vertex.
     */
    a: number;

    /** Second canonical connectivity label; a==b denotes an on-plane vertex. */
    b: number;

    /**
     * Cutter fraction oriented with canonical a/b; it is not a fitted curve
     * phase.
     */
    t: number;

    /**
     * Opt-in original edge aliases; omission means the trace cannot assert
     * their original addresses.
     */
    sourceEdges?: Array<{
      /** First original input vertex of this emitted-edge witness. */
      a: number;

      /**
       * Second original input vertex, distinct from any canonical
       * representative.
       */
      b: number;

      /** Physical plane-crossing fraction in this original edge direction. */
      t: number;

      /**
       * Original edge's registered physical witness in mm, retained even when
       * aliases share connectivity.
       */
      pointMm: Readonly<AutoMovieVector3Tuple>;
    }>;
  }>;

  /**
   * Chord phase at each raw point, starting at zero; closed closure has a
   * separate final segment.
   */
  cumulativePolylineMm: number[];

  /**
   * Full physical chord perimeter/length including a closed final edge; zero
   * for an isolated contact.
   */
  totalPolylineMm: number;

  /**
   * Directed emitted graph segments in point order, including all source faces
   * for each contribution.
   */
  segments: Array<{
    /** Cutter graph-edge identity, interpreted only within this input cut. */
    id: string;

    /** Index into points at the directed segment start. */
    from: number;

    /** Index into points at the end; zero on a genuine closing edge. */
    to: number;

    /** Start of this original polyline segment in physical chord mm. */
    startMm: number;

    /** End in physical chord mm, retaining actual final closure width. */
    endMm: number;

    /**
     * Complete native face ordinals emitting this directed contribution, not
     * endpoint-star supersets.
     */
    originalTriangleIds: number[];
  }>;
}
