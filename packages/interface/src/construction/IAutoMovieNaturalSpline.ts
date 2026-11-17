/** Data and callback contracts shared by the NaturalSpline operations. */
export namespace IAutoMovieNaturalSpline {
  /**
   * A spline prepared for evaluation; knot arrays are borrowed and must remain unchanged.
   *
   * @evidence contracts/development/design.md#principled-representation Knot values and solved second derivatives represent the natural cubic on strictly increasing abscissae.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three arrays expose the interpolation data without a separate evaluator object.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This structural record carries no validation or immutability guarantee; matching finite arrays remain producer premises.
   * @evidence contracts/development/common.md#meaningful-documentation Names the borrowed knots, values and owned curvature array, including their mutation restriction.
   */
  export interface ISpline {
    /** Strictly increasing knot abscissae. */
    xs: readonly number[];

    /** Knot values. */
    ys: readonly number[];

    /** Second derivative at every knot. */
    curvatures: number[];
  }
}
