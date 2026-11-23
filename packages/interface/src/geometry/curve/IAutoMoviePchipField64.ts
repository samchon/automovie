/**
 * Componentwise Fritsch–Butland interpolation with exposed local power
 * coefficients and station derivatives. Coordinates and component values use
 * caller-defined consistent units; queries outside the station range
 * extrapolate the first or last polynomial. Optional station or endpoint
 * derivatives replace the corresponding slope seeds without normalization or
 * unit conversion; those authored slopes can overshoot and do not retain the
 * default shape-preserving rule.
 */
export interface IAutoMoviePchipField64 {
  /**
   * Per-interval and per-component power coefficients [cubic, quadratic,
   * derivative, value] relative to the interval start.
   */
  readonly coefficients: number[][][];

  /** Station derivatives in component units per coordinate unit. */
  readonly derivatives: number[][];

  /** Increasing coordinates in one caller-owned chart. */
  readonly x: readonly number[];

  /** Finite component rows in fixed corresponding order. */
  readonly y: readonly (readonly number[])[];

  /**
   * Evaluate every component or its first/second derivative, selecting the
   * right interval at an interior knot. False/0 reads values, true/1 reads
   * first derivatives, and 2 reads second derivatives, in component units per
   * coordinate unit squared. Values outside the coordinate range extrapolate
   * the nearest interval; the caller owns a narrower supported domain when
   * needed. Nonfinite queries or generated results throw. Endpoint derivative
   * queries keep the existing Horner arithmetic and may differ from an authored
   * slope by rounding.
   */
  at(value: number, derivative?: boolean | 0 | 1 | 2): number[];
}

/** Construction-time slope overrides for the componentwise field. */
export namespace IAutoMoviePchipField64 {
  /**
   * Supplied endpoint slopes in component units per coordinate unit. An omitted
   * endpoint keeps its Fritsch–Butland seed. Construction checks finite dense
   * rows with the field's component count and copies each supplied row.
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
   * Supplied rows are copied during construction; no callback or live input is
   * retained.
   */
  export type Derivatives =
    | readonly (readonly number[])[]
    | IEndpointDerivatives;
}
