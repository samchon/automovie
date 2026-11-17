

/**
 * Componentwise interpolation preserving the first PCHIP interval and constructing a C2 clamped cubic on the remaining stations. Tail endpoint derivatives come from the same PCHIP seed; with fewer than four stations all seed intervals remain unchanged. Coordinates and values use consistent caller-owned units.
 *
 * @evidence contracts/development/design.md#principled-representation A tridiagonal second-derivative solve interpolates the tail values and clamps its endpoint derivatives to the original componentwise monotone field.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The first support interval is copied and the same exposed power-coefficient layout serves both seed and C2 tail queries.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No anatomical station, fit, tangent normalization or extrema guarantee is embedded in the spline kernel.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the preserved first interval, C2 tail, seeded end derivatives, small-input behavior and extrapolation policy.
 */
export interface IAutoMovieClampedTailField64  {
/** Per-interval descending cubic coefficients in the supplied ordinate units. */
  readonly coefficients: number[][][];

/** Ordered coordinates including the first interval retained as derivative support. */
    readonly x: readonly number[];

/**
   * Evaluate the value or derivative per coordinate unit; outside queries extrapolate the first or last polynomial and interior knots select the right interval.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Horner arithmetic evaluates the retained cubic or its analytic first derivative in the selected local interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Query kinds share interval selection and the coefficient array.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts There is no endpoint clamp, refit or coordinate normalization during evaluation.
   * @evidence contracts/development/common.md#meaningful-documentation States derivative units, extrapolation and interior-knot interval selection.
   * @evidence contracts/development/implementation.md#efficient-algorithms A linear station search and O(D) Horner evaluation use existing coefficients.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every query uses the constructor's coefficients without another slope or tridiagonal solve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned component array escapes; no query history is retained.
   */
  at(value: number, derivative?: boolean): number[] ;
}
