/**
 * Numerical candidates for isolated planar cubic critical parameters on the
 * open normalized span.
 *
 * An identically constant polynomial yields a continuum and contributes no
 * isolated root. Equal root values merge and nearby distinct candidates remain
 * distinct.
 */
export interface IAutoMovieCubicCriticalParameters {
  /**
   * Sorted union of the three candidate arrays, merging numerically identical
   * parameter values.
   */
  breaks: readonly number[];

  /**
   * Interior roots of the cross product of velocity and acceleration. The
   * candidates include potential inflections, repeated roots and stationary
   * points.
   */
  zeroCurvature: readonly number[];

  /**
   * Interior roots of the affine-curvature candidate equations for a regular
   * subarc. Categories may overlap.
   */
  affineCritical: readonly number[];

  /**
   * Interior velocity common-root candidates whose residuals pass the numerical
   * checks for both components.
   */
  stationary: readonly number[];

  /** True when the computed curvature-numerator coefficients all vanish. */
  collinear: boolean;

  /**
   * Numerical root qualifications and degenerate cases such as constant curves
   * or curvature continua.
   */
  diagnostics: readonly string[];
}
