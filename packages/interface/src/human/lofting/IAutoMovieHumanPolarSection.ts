/**
 * Type contracts exchanged by AutoMovieHumanPolarSection; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanPolarSection {
  /** Polar measures of one closed polygon. */
  export interface ISection {
    /** Area centroid `[x, z]`, mm. */
    centre: [number, number];

    /** Radius of the circle of the same area, mm. */
    radius: number;
  }

  /**
   * The polygon argument of AutoMovieHumanPolarSection.measure. Area centroid
   * and equivalent radius of a closed polygon `[x, z]`.
   */
  export type MeasurePolygon = readonly (readonly [number, number])[];

  /**
   * The polygon argument of AutoMovieHumanPolarSection.radius. Farthest
   * crossing of a ray from a point with a closed polygon.
   *
   * @param polygon Polygon `[x, z]`.
   * @param origin Ray origin.
   * @param angle Ray direction, the polar angle from +x toward +z.
   * @returns Distance along the ray, 0 when it meets nothing.
   */
  export type RadiusPolygon = readonly (readonly [number, number])[];

  /**
   * The origin argument of AutoMovieHumanPolarSection.radius. Farthest crossing
   * of a ray from a point with a closed polygon.
   *
   * @param polygon Polygon `[x, z]`.
   * @param origin Ray origin.
   * @param angle Ray direction, the polar angle from +x toward +z.
   * @returns Distance along the ray, 0 when it meets nothing.
   */
  export type RadiusOrigin = readonly [number, number];
}
