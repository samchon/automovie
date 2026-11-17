/** Type contracts exchanged by AutoMovieHumanTrunkSolve; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkSolve {
  /** A scalar function's value with its first two derivatives.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A scalar function's value with its first two derivatives.
   * @evidence contracts/development/design.md#principled-representation `value`: The value. `slope`: The first derivative. `curvature`: The second derivative.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmRootOval.outline, AutoMovieHumanTrunkSolve.quintic. Read by AutoMovieHumanShoulderCap.create, AutoMovieHumanTrunkSolve.quintic. Also types AutoMovieHumanShoulderCap.low, AutoMovieHumanShoulderLine.low.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `value`, `slope`, `curvature`; callers supply the complete record.
   */
  export interface IJet {
    /** The value. */
    value: number;

    /** The first derivative. */
    slope: number;

    /** The second derivative. */
    curvature: number;
  }

  /** The f argument of AutoMovieHumanTrunkSolve.bisect. The root of a monotone function over an interval.
  The function is called once more at the result, last, so a function that
  stores its argument (a landmark the construction reads back) is left
  holding the solution.
  @param lo Lower end of the interval.
  @param hi Upper end of the interval.
  @param f Function whose root is wanted, in the unit of its argument's course.
  @param sign 1 when the function rises over the interval, -1 when it falls.
  @returns The argument at which the function crosses zero, or an end of the interval when it does not.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The root of a monotone function over an interval.
 * @evidence contracts/development/design.md#principled-representation The root of a monotone function over an interval. The callable takes x and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkSolve.BisectF is the canonical exchange used by AutoMovieHumanTrunkSolve.bisect.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkSolve.bisect for the root of a monotone function over an interval.
 */
  export type BisectF = (x: number) => number;

  /** The f argument of AutoMovieHumanTrunkSolve.jet. A function with its first two derivatives by central differences over
  0.05 mm: the displacements are smooth closed forms, so the differences
  carry the derivatives the sector joins need.
  @param f The function of z.
  @returns The function returning `[f, f', f'']`.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need.
 * @evidence contracts/development/design.md#principled-representation A function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need. The callable takes z and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkSolve.JetF is the canonical exchange used by AutoMovieHumanTrunkSolve.jet.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkSolve.jet for a function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need.
 */
  export type JetF = (z: number) => number;

  /** Result of AutoMovieHumanTrunkSolve.jet. A function with its first two derivatives by central differences over
  0.05 mm: the displacements are smooth closed forms, so the differences
  carry the derivatives the sector joins need.
  @param f The function of z.
  @returns The function returning `[f, f', f'']`.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need.
 * @evidence contracts/development/design.md#principled-representation A function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need. The callable takes z and returns [number, number, number].
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkSolve.JetResult is the canonical exchange used by AutoMovieHumanTrunkSolve.jet.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkSolve.jet for a function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need.
 */
  export type JetResult = (z: number) => [number, number, number];
}
