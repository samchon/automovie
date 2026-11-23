import type { AutoMovieVector2Tuple } from "../../../geometry/AutoMovieVector2Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanFootSectors; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanFootSectors exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IPiece, ISectors, JoinMiss. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanFootSectors; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IPiece, ISectors, JoinMiss contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanFootSectors {
  /** A piece's dense points and their arclengths.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A piece's dense points and their arclengths.
   * @evidence contracts/development/design.md#principled-representation `points`: Dense points in order. `lengths`: Arclength up to each point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootSectors.piece. Read by AutoMovieHumanFootSectors.join. Also types AutoMovieHumanFootSectors.p.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `points`, `lengths`; callers supply the complete record.
   */
  export interface IPiece {
    /** Dense points in order. */
    points: AutoMovieVector2Tuple[];

    /** Arclength up to each point. */
    lengths: number[];
  }

  /** The joined ring.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The joined ring.
   * @evidence contracts/development/design.md#principled-representation `at`: The point at a phase. `start`: The phase where a piece starts. `find`: The phase on any of the given pieces where the across coordinate is `v`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootSectors.join. Also types AutoMovieHumanFootBody.sectors, AutoMovieHumanFootToeSection.sectors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `start`, `find`; callers supply the complete record.
   */
  export interface ISectors {
    /**
     * Section point in millimetres at ring phase t in radians, wrapped over a full turn and interpolated by each piece's sampled arclength.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Section point in millimetres at ring phase t in radians, wrapped over a full turn and interpolated by each piece's sampled arclength.
     */
    at: (t: number) => AutoMovieVector2Tuple;

    /**
     * Ring phase in radians of a zero-based piece's start; index must address the pieces supplied to join.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Ring phase in radians of a zero-based piece's start; index must address the pieces supplied to join.
     */
    start: (index: number) => number;

    /**
     * Find the first crossing or exact vertex of across coordinate v in millimetres, in the listed piece order, returning ring phase in radians. If no crossing exists, notify the join callback and return the vertex with the smallest across-coordinate distance, including terminal endpoints; equal distances keep the first vertex. The listed indices must name nonempty pieces with positive sampled length. This is a one-coordinate polyline query, not Euclidean distance to a continuous source curve.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States crossing order, exact-vertex handling, the complete endpoint fallback, tie behavior, phase units and the valid sampled-piece premise.
     */
    find: (v: number, pieces: number[]) => number;
  }

  /** The miss argument of AutoMovieHumanFootSectors.join. Pieces joined into a ring over their fixed shares.
  @param pieces The pieces in ring order.
  @param shares Each piece's share of the ring's control points.
  @param miss Told when a cleft lies outside the listed pieces, which then answer their nearest point.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Pieces joined into a ring over their fixed shares.
 * @evidence contracts/development/design.md#principled-representation Pieces joined into a ring over their fixed shares. The callable takes detail and returns void.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootSectors.JoinMiss is the canonical exchange used by AutoMovieHumanFootSectors.join.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootSectors.join for pieces joined into a ring over their fixed shares.
 */
  export type JoinMiss = (detail: string) => void;
}
