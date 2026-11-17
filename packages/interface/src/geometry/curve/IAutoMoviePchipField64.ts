

/**
 * Componentwise Fritsch–Butland interpolation with exposed local power coefficients and station derivatives. Coordinates and component values use caller-defined consistent units; queries outside the station range extrapolate the first or last polynomial. Optional station or endpoint derivatives replace the corresponding slope seeds without normalization or unit conversion; those authored slopes can overshoot and do not retain the default shape-preserving rule.
 *
 * @evidence contracts/development/design.md#principled-representation Each component uses the same weighted harmonic and endpoint-limited scalar slopes unless explicitly replaced, then the same cubic Hermite power coefficients interpolate its supports and declared first derivatives. Authored slopes do not imply monotonicity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The coefficient field is separate from AutoMoviePchip64 because vector consumers need coefficient access and polynomial extrapolation rather than the scalar field's closed-domain query policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No spatial tangent normalization or anatomical coordinate convention modifies the componentwise interpolation.
 * @evidence contracts/development/common.md#meaningful-documentation States component ordering, derivative units, explicit slope authority, extrapolation and caller responsibility for stable supplied support arrays. Overrides are copied at construction.
 */
export interface IAutoMoviePchipField64  {
/** Per-interval and per-component power coefficients [cubic, quadratic, derivative, value] relative to the interval start. */
  readonly coefficients: number[][][];

/** Station derivatives in component units per coordinate unit. */
  readonly derivatives: number[][];

/** Increasing coordinates in one caller-owned chart. */
    readonly x: readonly number[];

/** Finite component rows in fixed corresponding order. */
    readonly y: readonly (readonly number[])[];

/**
   * Evaluate every component or its first/second derivative, selecting the right interval at an interior knot. False/0 reads values, true/1 reads first derivatives, and 2 reads second derivatives, in component units per coordinate unit squared. Values outside the coordinate range extrapolate the nearest interval; the caller owns a narrower supported domain when needed. Nonfinite queries or generated results throw. Endpoint derivative queries keep the existing Horner arithmetic and may differ from an authored slope by rounding.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The same retained local power coefficients produce values and their analytic first or second derivatives through Horner arithmetic; no independently fitted derivative field is introduced.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interval selection serves every component and both query kinds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Extrapolation is explicit polynomial continuation, without hidden end clamps or spatial renormalization.
   * @evidence contracts/development/common.md#meaningful-documentation States backward-compatible boolean queries, explicit derivative orders, right-interval knot selection, extrapolation, units and endpoint rounding.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear station search plus O(D) component evaluation, with no slope resolution in the query path.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Queries share the constructor's coefficients, including when consumers query derivatives at the same station repeatedly.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned component array is allocated; no query coordinate or result is retained by the field.
   */
  at(value: number, derivative?: boolean | 0 | 1 | 2): number[] ;
}
