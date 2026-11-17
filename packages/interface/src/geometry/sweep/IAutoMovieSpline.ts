/** Data and callback contracts shared by the Spline operations. */
export namespace IAutoMovieSpline {
  /**
   * Choose the sampled-policy tension and solve the knots' second derivatives.
   */
  export type IFitM = { [index: number]: number };

  /**
   * Choose the sampled-policy tension and solve the knots' second derivatives.
   */
  export type IFitScratch = { [index: number]: number };
}
