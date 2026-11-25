import type { AutoMovieVector2Tuple } from "../../../geometry/AutoMovieVector2Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanFootSectors; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanFootSectors {
  /** A piece's dense points and their arclengths. */
  export interface IPiece {
    /** Dense points in order. */
    points: AutoMovieVector2Tuple[];

    /** Arclength up to each point. */
    lengths: number[];
  }

  /** The joined ring. */
  export interface ISectors {
    /**
     * Section point in millimetres at ring phase t in radians, wrapped over a
     * full turn and interpolated by each piece's sampled arclength.
     */
    at: (t: number) => AutoMovieVector2Tuple;

    /**
     * Ring phase in radians of a zero-based piece's start; index must address
     * the pieces supplied to join.
     */
    start: (index: number) => number;

    /**
     * Find the first crossing or exact vertex of across coordinate v in
     * millimetres, in the listed piece order, returning ring phase in radians.
     * If no crossing exists, notify the join callback and return the vertex
     * with the smallest across-coordinate distance, including terminal
     * endpoints; equal distances keep the first vertex. The listed indices must
     * name nonempty pieces with positive sampled length. This is a
     * one-coordinate polyline query, not Euclidean distance to a continuous
     * source curve.
     */
    find: (v: number, pieces: number[]) => number;
  }

  /**
   * The miss argument of AutoMovieHumanFootSectors.join. Pieces joined into a
   * ring over their fixed shares.
   *
   * @param pieces The pieces in ring order.
   * @param shares Each piece's share of the ring's control points.
   * @param miss Told when a cleft lies outside the listed pieces, which then
   *   answer their nearest point.
   */
  export type JoinMiss = (detail: string) => void;
}
