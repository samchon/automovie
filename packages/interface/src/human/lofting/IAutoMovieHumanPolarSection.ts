/**
 * Type contracts exchanged by AutoMovieHumanPolarSection; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanPolarSection exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups ISection, MeasurePolygon, RadiusPolygon, RadiusOrigin. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanPolarSection; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the ISection, MeasurePolygon, RadiusPolygon, RadiusOrigin contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanPolarSection {
  /** Polar measures of one closed polygon.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Polar measures of one closed polygon.
   * @evidence contracts/development/design.md#principled-representation `centre`: Area centroid `[x, z]`, mm. `radius`: Radius of the circle of the same area, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanPolarSection.measure. Also types AutoMovieHumanLegLaw.ankleSection, AutoMovieHumanLegLaw.crotchSection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `centre`, `radius`; callers supply the complete record.
   */
  export interface ISection {
    /** Area centroid `[x, z]`, mm. */
    centre: [number, number];

    /** Radius of the circle of the same area, mm. */
    radius: number;
  }

  /** The polygon argument of AutoMovieHumanPolarSection.measure. Area centroid and equivalent radius of a closed polygon `[x, z]`.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Area centroid and equivalent radius of a closed polygon `[x, z]`.
   * @evidence contracts/development/design.md#principled-representation Area centroid and equivalent radius of a closed polygon `[x, z]`. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanPolarSection.MeasurePolygon is the canonical exchange used by AutoMovieHumanPolarSection.measure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanPolarSection.measure for area centroid and equivalent radius of a closed polygon `[x, z]`.
   */
  export type MeasurePolygon = readonly (readonly [number, number])[];

  /** The polygon argument of AutoMovieHumanPolarSection.radius. Farthest crossing of a ray from a point with a closed polygon.
  @param polygon Polygon `[x, z]`.
  @param origin Ray origin.
  @param angle Ray direction, the polar angle from +x toward +z.
  @returns Distance along the ray, 0 when it meets nothing.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Farthest crossing of a ray from a point with a closed polygon.
 * @evidence contracts/development/design.md#principled-representation Farthest crossing of a ray from a point with a closed polygon. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanPolarSection.RadiusPolygon is the canonical exchange used by AutoMovieHumanPolarSection.radius.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanPolarSection.radius for farthest crossing of a ray from a point with a closed polygon.
 */
  export type RadiusPolygon = readonly (readonly [number, number])[];

  /** The origin argument of AutoMovieHumanPolarSection.radius. Farthest crossing of a ray from a point with a closed polygon.
  @param polygon Polygon `[x, z]`.
  @param origin Ray origin.
  @param angle Ray direction, the polar angle from +x toward +z.
  @returns Distance along the ray, 0 when it meets nothing.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Farthest crossing of a ray from a point with a closed polygon.
 * @evidence contracts/development/design.md#principled-representation Farthest crossing of a ray from a point with a closed polygon. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanPolarSection.RadiusOrigin is the canonical exchange used by AutoMovieHumanPolarSection.radius.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanPolarSection.radius for farthest crossing of a ray from a point with a closed polygon.
 */
  export type RadiusOrigin = readonly [number, number];
}
