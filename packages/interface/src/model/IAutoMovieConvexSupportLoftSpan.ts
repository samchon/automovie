/** Cubic support offsets over one physical Y interval. */
export interface IAutoMovieConvexSupportLoftSpan {
  /** Lower and upper physical Y coordinates, in metres. */
  interval: [number, number];

  /**
   * Four Bernstein offsets per plane, in registry order and metres; adjacent
   * spans share endpoints exactly.
   */
  offsets: [number, number, number, number][];
}
