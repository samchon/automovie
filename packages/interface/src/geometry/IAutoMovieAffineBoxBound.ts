/** Contracts for bounding one affine row over an independent-control box. */
export namespace IAutoMovieAffineBoxBound {
  /**
   * Bound the row image and compare its exact squared target distance with the
   * squared tolerance.
   *
   * Repeated control IDs combine in input order with binary64 addition. The
   * calculation then uses the resulting finite values as exact dyadic numbers.
   * The result describes this row alone. Invalid fields, reversed bounds,
   * exhausted budgets or an unrepresentable numeric result throw.
   */
  export type Operation = (input: IInput) => IResult;

  /** A finite three-dimensional affine row and its shared control bounds. */
  export type IInput = {
    /** Constant part of the substituted position row, in millimetres. */
    constantMm: readonly [number, number, number];

    /**
     * Independent control IDs and signed weights. Repeated IDs combine in input
     * order and each supplied term counts toward the budget.
     */
    terms: readonly ITerm[];

    /** Common independent-control lower bounds in millimetres. */
    lowerMm: readonly [number, number, number];

    /** Common upper bounds in millimetres, at or above the lower bounds. */
    upperMm: readonly [number, number, number];

    /** Target observation in millimetres, within or outside the box. */
    targetMm: readonly [number, number, number];

    /** Positive finite threshold in millimetres. Exact equality is feasible. */
    toleranceMm: number;

    /** Positive safe integer cap on supplied terms, including repetitions. */
    maxTerms: number;
  };

  /** One signed coefficient assigned to an independent control. */
  export type ITerm = {
    /** Nonnegative safe integer ordinal in the owning control registry. */
    id: number;

    /** Finite dimensionless coefficient for this control. */
    weight: number;
  };

  /** Numeric views of the single row's exact image and its distance decision. */
  export type IResult = {
    /** Outward-rounded lower endpoints in millimetres. */
    lowerMm: [number, number, number];

    /** Outward-rounded upper endpoints in millimetres. */
    upperMm: [number, number, number];

    /** Approximate finite distance to the row image, in millimetres. */
    minimumDistanceMm: number;

    /** True when the squared row distance strictly exceeds squared tolerance. */
    infeasibleAtTolerance: boolean;

    /** Finite binary64 sum of combined weights in first-address order. */
    weightSum: number;

    /** Finite sum of absolute combined weights in first-address order. */
    absoluteWeightSum: number;

    /** Count of unique original IDs, including controls whose weight cancels. */
    terms: number;

    /** Message describing which decision is exact and which values are views. */
    diagnostic: string;
  };
}
