/**
 * Sampling density for construction inspection polylines.
 *
 * @evidence contracts/development/design.md#principled-representation Dimensionless phase and station subdivision counts control sampling without altering source geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface sampleAutoMovieConstructionCurves uses these counts for section rings, four guides and the sampled-ring centroid axis.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Density does not certify geometric accuracy; nonfinite source samples are omitted and flagged by the sampler.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the sampled outputs and numerical count semantics.
 */
export namespace IAutoMovieSampleConstructionCurves {
  /**
   * Optional density overrides, read synchronously and never retained or changed.
   * The sampler validates both resolved counts before reading chains, even when
   * there are no chains. Invalid counts throw a named Error. Outputs use metres
   * in the construction frame, converted from the source's millimetre points.
   *
   * @evidence contracts/development/design.md#principled-representation Independent ring sample and station interval counts preserve the four quarter-phase guide addresses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The sampler defaults missing counts and uses the same ring samples for sections, guides and centroid-axis points.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Integer and divisibility admission belongs to sampleAutoMovieConstructionCurves; no upper bound or error tolerance is implied.
   * @evidence contracts/development/common.md#meaningful-documentation States defaults, count validation, no retention and output unit conversion.
   */
  export type IOptions = {
    /** Uniform samples around [0,2pi), default 48; an integer at least 8 and divisible by 4. The closing point is not repeated. */
    phases?: number;

    /** Equal subdivisions per interval between owned endpoints and principal layer stations, default 8; a positive integer. */
    steps?: number;
  };
}
