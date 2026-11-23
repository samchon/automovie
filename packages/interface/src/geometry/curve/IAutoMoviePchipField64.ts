/**
 * Componentwise Fritsch–Butland interpolation with exposed local power coefficients and station derivatives. Coordinates and component values use caller-defined consistent units; queries outside the station range extrapolate the first or last polynomial. Optional station or endpoint derivatives replace the corresponding slope seeds without normalization or unit conversion; those authored slopes can overshoot and do not retain the default shape-preserving rule.
 *
 * @evidence contracts/development/design.md#principled-representation Each component uses the same weighted harmonic and endpoint-limited scalar slopes unless explicitly replaced, then the same cubic Hermite power coefficients interpolate its supports and declared first derivatives. Authored slopes do not imply monotonicity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The coefficient field is separate from AutoMoviePchip64 because vector consumers need coefficient access and polynomial extrapolation rather than the scalar field's closed-domain query policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No spatial tangent normalization or anatomical coordinate convention modifies the componentwise interpolation.
 * @evidence contracts/development/common.md#meaningful-documentation States component ordering, derivative units, explicit slope authority, extrapolation and caller responsibility for stable supplied support arrays. Overrides are copied at construction.
 */
export interface IAutoMoviePchipField64 {
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
   * @evidence contracts/development/common.md#meaningful-documentation States backward-compatible boolean queries, explicit derivative orders, right-interval knot selection, extrapolation, units and endpoint rounding.
   */
  at(value: number, derivative?: boolean | 0 | 1 | 2): number[];
}

/** Construction-time slope overrides for the componentwise field. */
export namespace IAutoMoviePchipField64 {
  /**
   * Supplied endpoint slopes in component units per coordinate unit. An omitted
   * endpoint keeps its Fritsch–Butland seed. Construction checks finite dense
   * rows with the field's component count and copies each supplied row.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States derivative units, omitted endpoint behavior, copied ownership and the constructor's row admission.
   * @evidence contracts/development/design.md#principled-representation Independent optional start/end rows describe exactly the endpoint overrides; row width and finiteness depend on the constructed field and are checked there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMoviePchipField64 consumes these two boundary overrides while its complete-row form remains another construction option.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Supplied slopes retain their magnitudes without spatial normalization; they may overshoot and do not promise the default shape-preserving behavior.
   */
  export interface IEndpointDerivatives {
    /** First-station component slopes; omitted preserves the computed seed. */
    start?: readonly number[];

    /** Last-station component slopes; omitted preserves the computed seed. */
    end?: readonly number[];
  }

  /**
   * Either one slope row per support station or selected endpoint overrides.
   * Complete rows follow station order and every row follows component order.
   * Supplied rows are copied during construction; no callback or live input is retained.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two supported input forms, station/component ordering, copied rows and derivative units inherited from the endpoint contract.
   * @evidence contracts/development/design.md#principled-representation Array rows replace every station seed; an endpoint record replaces only its present ends. The constructor checks the station count and all finite component dimensions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One canonical union describes the existing public constructor's third argument and reuses its endpoint record instead of repeating the inline input shape.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type preserves readonly inputs and existing numeric admission; it adds no new interpolation branch or implicit conversion.
   */
  export type Derivatives =
    | readonly (readonly number[])[]
    | IEndpointDerivatives;
}
