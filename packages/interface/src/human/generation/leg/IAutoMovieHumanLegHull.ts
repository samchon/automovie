/**
 * Type contracts exchanged by AutoMovieHumanLegHull; runtime evaluation remains
 * in Human.
 */
export namespace IAutoMovieHumanLegHull {
  /**
   * The points argument of AutoMovieHumanLegHull.girth. The taut girth of
   * planar points.
   *
   * @param points Section points `[x, z]`, mm, in any order.
   * @returns Perimeter of their convex hull, mm; 0 for fewer than three points.
   */
  export type GirthPoints = readonly (readonly [number, number])[];
}
