/*
 * A contact pair's row along one direction (`pairXpbdContactRow`).
 */
export interface IAutoMovieXpbdContactRow {
  /*
   * The row's generalised inverse mass.
   */
  weight: number;

  /*
   * Hold the joint axes the move by a multiplier would carry onto or past a
   * bound (`IAutoMovieXpbdPointResponse.limit`); the row is then read again.
   * Parameter scale: The multiplier, newton seconds squared.
   * Returns: Whether any axis was newly held.
   */
  limit(scale: number): boolean;

  /*
   * Move the pair by a multiplier along the row.
   * Parameter scale: The multiplier, newton seconds squared.
   */
  apply(scale: number): void;
}
