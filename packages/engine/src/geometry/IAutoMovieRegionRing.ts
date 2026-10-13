/** One closed ring's span inside a triangulation's shared point list. */
export interface IAutoMovieRegionRing {
  /**
   * First index the ring owns in {@link IAutoMovieRegionTriangulation.points}.
   */
  start: number;
  /** How many points the ring owns. */
  count: number;
}
