/**
 * Type contracts exchanged by AutoMovieHumanTrunkSolve; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanTrunkSolve {
  /** A scalar function's value with its first two derivatives. */
  export interface IJet {
    /** The value. */
    value: number;

    /** The first derivative. */
    slope: number;

    /** The second derivative. */
    curvature: number;
  }

  /**
   * The f argument of AutoMovieHumanTrunkSolve.bisect. The root of a monotone
   * function over an interval. The function is called once more at the result,
   * last, so a function that stores its argument (a landmark the construction
   * reads back) is left holding the solution.
   *
   * @param lo Lower end of the interval.
   * @param hi Upper end of the interval.
   * @param f Function whose root is wanted, in the unit of its argument's
   *   course.
   * @param sign 1 when the function rises over the interval, -1 when it falls.
   * @returns The argument at which the function crosses zero, or an end of the
   *   interval when it does not.
   */
  export type BisectF = (x: number) => number;

  /**
   * The f argument of AutoMovieHumanTrunkSolve.jet. A function with its first
   * two derivatives by central differences over 0.05 mm: the displacements are
   * smooth closed forms, so the differences carry the derivatives the sector
   * joins need.
   *
   * @param f The function of z.
   * @returns The function returning `[f, f', f'']`.
   */
  export type JetF = (z: number) => number;

  /**
   * Result of AutoMovieHumanTrunkSolve.jet. A function with its first two
   * derivatives by central differences over 0.05 mm: the displacements are
   * smooth closed forms, so the differences carry the derivatives the sector
   * joins need.
   *
   * @param f The function of z.
   * @returns The function returning `[f, f', f'']`.
   */
  export type JetResult = (z: number) => [number, number, number];
}
