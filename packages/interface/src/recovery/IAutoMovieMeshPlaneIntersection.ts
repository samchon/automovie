import type { AutoMovieVector3Tuple } from "..";

/**
 * One registered mesh-plane intersection with a canonical point address and
 * optional original edge witnesses.
 */
export interface IAutoMovieMeshPlaneIntersection {
  /** Registered Cartesian point of the cut observation, in millimetres. */
  p: AutoMovieVector3Tuple;

  /** First canonical source endpoint address. */
  a: number;

  /** Second canonical source endpoint address, equal to a for a source vertex. */
  b: number;

  /** Dimensionless interpolation from a to b, or zero for a vertex hit. */
  t: number;

  /**
   * Optional original physical edge occurrences contributing to this canonical
   * point.
   */
  sourceEdges?: Array<{
    /**
     * First original source vertex address of the emitting intersection
     * witness.
     */
    a: number;

    /**
     * Second original source vertex address of the emitting intersection
     * witness.
     */
    b: number;

    /** Dimensionless interpolation fraction from this occurrence's a to b. */
    t: number;

    /** Registered measured point for this original occurrence, in millimetres. */
    pointMm: AutoMovieVector3Tuple;
  }>;
}
