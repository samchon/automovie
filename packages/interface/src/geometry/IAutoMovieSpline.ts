/** Caller-owned derivative and scratch buffers for the tension spline kernel. */
export namespace IAutoMovieSpline {
  /** Writable destination with one second derivative per fitted spline knot. */
  export type IFitM = { [index: number]: number };

  /**
   * Caller-owned writable workspace of at least 7n + 17 scalars for fitting n
   * knots.
   */
  export type IFitScratch = { [index: number]: number };
}
