/**
 * Coverage metadata required for a saved aligned-ellipse recipe. An admitted
 * compile produces only the inferred open lateral surface within the saved
 * longitudinal interval.
 */
export interface IAutoMovieRecoveryImageLoftCoverage {
  /** The generated lateral surface is inferred under the aligned ellipse prior. */
  lateralSurface: "inferred-under-aligned-ellipse-prior";

  /** The open loft omits caps at both longitudinal endpoints. */
  endCaps: "unobserved";

  /** The recipe leaves interior geometry unobserved. */
  interior: "unobserved";

  /** The source cameras were supplied to observation and fitting. */
  cameras: "supplied";
}
