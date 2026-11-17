/** Type contracts exchanged by AutoMovieHumanHandVector; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHandVector {
  /** The points argument of AutoMovieHumanHandVector.hull. Perimeter of the convex hull of points in a plane (Andrew's monotone
  chain): a taut tape drawn round the section, the way a tape measure reads
  a girth.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Perimeter of the convex hull of points in a plane (Andrew's monotone chain): a taut tape drawn round the section, the way a tape measure reads a girth.
 * @evidence contracts/development/design.md#principled-representation Perimeter of the convex hull of points in a plane (Andrew's monotone chain): a taut tape drawn round the section, the way a tape measure reads a girth. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandVector.HullPoints is the canonical exchange used by AutoMovieHumanHandVector.hull.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandVector.hull for perimeter of the convex hull of points in a plane (Andrew's monotone chain): a taut tape drawn round the section, the way a tape measure reads a girth.
 */
  export type HullPoints = readonly [number, number][];
}
