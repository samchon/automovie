/** One knot of a reduced loop: point, tangent and chord parameter. */
export interface IAutoMoviePlanarHermiteKnot {
  /**
   * Index of the dense point it sits on, in the caller's array (excluded
   * samples counted).
   */
  index: number;

  /**
   * Cumulative chord length in the loop's length unit, millimetres for
   * extracted sections; excluded samples do not contribute.
   */
  t: number;

  /**
   * Copied dense [a,b] sample in the loop's plane and length unit, millimetres
   * for extracted sections.
   */
  point: [number, number];

  /**
   * Tangent d point / d t, fitted to the dense samples of its two spans; its
   * axis component is zero at an axis extreme.
   */
  tangent: [number, number];
}
