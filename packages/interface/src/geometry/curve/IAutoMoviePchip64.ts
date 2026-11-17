/**
 * A scalar piecewise cubic with Fritsch–Butland slope seeds, in arbitrary consistent coordinate and value units. Explicit derivatives replace those seeds; evaluation rejects extrapolation and chooses the right interval at an interior knot.
 *
 * @evidence contracts/development/design.md#principled-representation Weighted harmonic interior slopes and bounded three-point endpoint slopes follow Fritsch and Butland, https://doi.org/10.1137/0905021; local power coefficients interpolate the supplied values and derivatives.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One scalar field owns its interval coefficients; reusable slope resolution is exposed separately for callers constructing vector or tensor fields.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No anatomy, smoothing fit, coordinate conversion or replacement endpoint derivative is introduced.
 * @evidence contracts/development/common.md#meaningful-documentation States derivative units, caller-owned immutable station storage, knot selection and extrapolation refusal.
 */
export interface IAutoMoviePchip64 {
  /**
   * Evaluate inside the closed coordinate range; derivative output has value units per coordinate unit. Nonfinite input, extrapolation and nonfinite results reject.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Horner evaluation uses the interval's local coordinate; differentiating those same power coefficients gives the first derivative.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The derivative switch shares interval selection and coefficient storage with ordinary evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An out-of-domain query is rejected rather than clamped or extrapolated, and no derivative normalization changes its units.
   * @evidence contracts/development/common.md#meaningful-documentation States the closed domain, right-interval knot convention and finite-result requirement.
   * @evidence contracts/development/implementation.md#efficient-algorithms Interval search is O(n); the selected cubic then uses a fixed number of scalar operations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both query kinds read the coefficients retained by the constructor, without rebuilding slopes.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A query retains no prior coordinate or result and allocates no interval arrays.
   */
  at(x: number, derivative?: boolean): number;
}
