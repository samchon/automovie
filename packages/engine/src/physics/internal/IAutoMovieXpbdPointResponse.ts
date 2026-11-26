/** The articulated response to a set of unit impulses acting together. */
export interface IAutoMovieXpbdPointResponse {
  /**
   * The generalised inverse mass of the row: each impulse's direction against
   * its point's displacement under all of them.
   */
  weight: number;

  /**
   * Hold every free axis the response scaled by a multiplier would carry onto
   * or past one of its bounds, and factor its tree again; the response is then
   * stale and is read again.
   *
   * @param scale The multiplier, newton seconds squared.
   * @returns Whether any axis was newly held.
   */
  limit(scale: number): boolean;

  /**
   * Move the trees by the response scaled by a multiplier: the root by its
   * change, every other body by its joint's model at the moved coordinates.
   *
   * @param scale The multiplier, newton seconds squared.
   */
  apply(scale: number): void;
}
