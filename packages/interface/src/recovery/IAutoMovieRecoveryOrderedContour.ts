import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoverySourceLineage,
} from "..";

/**
 * One reobserved contour in raw point order, with the saved publication and
 * original face support.
 */
export interface IAutoMovieRecoveryOrderedContour {
  /** Original zero-based ordinal of this raw contour at its saved station. */
  contourIndex: number;

  /** Whether the raw cutter emitted a cycle. */
  closed: boolean;

  /** Caller-attested saved publication that survived raw binding. */
  publication: IAutoMovieRecoverySourceLineage["publication"];

  /** Broad native face support from the observed point incidence. */
  sourceTriangleIds: number[];

  /** Original native face IDs that actually emitted the raw contour. */
  exactSourceTriangleIds: number[];

  /**
   * Raw cut points in cutter order with their original edge addresses and
   * interpolation parameters.
   */
  points: Array<{
    /** Registered raw cut point in millimetres. */
    p: Readonly<AutoMovieVector3Tuple>;

    /** First canonical source endpoint of the raw cut point. */
    a: number;

    /** Second canonical source endpoint, equal to a for a source vertex hit. */
    b: number;

    /** Dimensionless fraction along the canonical address from a to b. */
    t: number;

    /** Original edge occurrences retained for this possibly aliased cut point. */
    sourceEdges?: Array<{
      /** First original vertex address of this raw edge occurrence. */
      a: number;

      /** Second original vertex address of this raw edge occurrence. */
      b: number;

      /** Dimensionless fraction from the occurrence's original a endpoint to b. */
      t: number;

      /** Registered point in millimetres for this original edge occurrence. */
      pointMm: Readonly<AutoMovieVector3Tuple>;
    }>;
  }>;

  /**
   * Measured distance along consecutive raw points from the first point, in
   * millimetres.
   */
  cumulativePolylineMm: number[];

  /**
   * Measured contour length in millimetres, including the final seam for a
   * closed contour.
   */
  totalPolylineMm: number;

  /**
   * Ordered raw segments with endpoint indices, chord positions and original
   * emitting faces.
   */
  segments: Array<{
    /** Official cut segment identity used for its emitting face record. */
    id: string;

    /** Original raw point index where this segment begins. */
    from: number;

    /**
     * Original raw point index where this segment ends. For the closing segment
     * this is zero.
     */
    to: number;

    /** Cumulative raw polyline phase at the segment start in millimetres. */
    startMm: number;

    /**
     * Cumulative raw polyline phase at the segment end in millimetres,
     * including any closing seam.
     */
    endMm: number;

    /**
     * Original native triangle ordinals supplied by the caller map for the
     * segment's actual emitting faces.
     */
    originalTriangleIds: number[];
  }>;
}
