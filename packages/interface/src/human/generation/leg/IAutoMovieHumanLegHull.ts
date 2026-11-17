/**
 * Type contracts exchanged by AutoMovieHumanLegHull; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanLegHull exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups GirthPoints. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanLegHull; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the GirthPoints contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanLegHull {
  /** The points argument of AutoMovieHumanLegHull.girth. The taut girth of planar points.
  @param points Section points `[x, z]`, mm, in any order.
  @returns Perimeter of their convex hull, mm; 0 for fewer than three points.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The taut girth of planar points.
 * @evidence contracts/development/design.md#principled-representation The taut girth of planar points. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegHull.GirthPoints is the canonical exchange used by AutoMovieHumanLegHull.girth.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegHull.girth for the taut girth of planar points.
 */
  export type GirthPoints = readonly (readonly [number, number])[];
}
