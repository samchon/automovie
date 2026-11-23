/**
 * Isolated numerical source-cubic critical candidates on normalized (0,1). D=0
 * includes inflections and stationary points; categories may overlap. No
 * endpoint or unresolved continuum is fabricated as an isolated root.
 */
export interface IAutoMovieCubicCriticalParameters {
  /** Sorted exact-value union of the three numerical candidate arrays. */
  breaks: readonly number[];

  /** Interior roots of cross(p',p''); not necessarily regular inflections. */
  zeroCurvature: readonly number[];

  /** Interior roots of the affine-curvature critical equations where defined. */
  affineCritical: readonly number[];

  /** Interior velocity common-root candidates, checked in both coordinates. */
  stationary: readonly number[];

  /** Computed curvature-numerator polynomial is identically zero. */
  collinear: boolean;

  /** Degenerate continua and finite arithmetic/root-observation limitations. */
  diagnostics: readonly string[];
}
