import type { AutoMovieVector2Tuple } from "../../../geometry/AutoMovieVector2Tuple";

/** Type contracts exchanged by AutoMovieHumanFootSectors; runtime evaluation remains in Human. */
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
    /** The point at a phase. */
    at: (t: number) => AutoMovieVector2Tuple;

    /** The phase where a piece starts. */
    start: (index: number) => number;

    /** The phase on any of the given pieces where the across coordinate is `v`. */
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
