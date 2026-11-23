/**
 * Bound one declared affine row over a common independent-coefficient box.
 * Duplicate original IDs first combine in input order using binary64 addition.
 * The resulting floating-point coefficients, constants, bounds and target are
 * then interpreted as exact dyadic numbers. Endpoint arithmetic and the strict
 * squared-distance comparison against tolerance are exact for that row.
 * Returned endpoints round outward. minimumDistanceMm is an approximate number
 * view; only infeasibleAtTolerance uses the exact comparison. A false decision
 * does not establish that several observations can be fitted simultaneously.
 * Row identities do not identify source vertices, and this box is not generated
 * geometry, continuous source support or a closest-surface distance
 * certificate. Nonfinite input, conflicting bounds, invalid IDs, exhausted raw
 * term budgets, nonfinite duplicate sums or nonrepresentable number views throw
 * atomically.
 */

export namespace IAutoMovieAffineBoxBound {
  /**
   * Bound one declared affine row over a common independent-coefficient box.
   * Duplicate original IDs first combine in input order using binary64
   * addition. The resulting floating-point coefficients, constants, bounds and
   * target are then interpreted as exact dyadic numbers. Endpoint arithmetic
   * and the strict squared-distance comparison against tolerance are exact for
   * that row. Returned endpoints round outward. minimumDistanceMm is an
   * approximate number view; only infeasibleAtTolerance uses the exact
   * comparison. A false decision does not establish that several observations
   * can be fitted simultaneously. Row identities do not identify source
   * vertices, and this box is not generated geometry, continuous source support
   * or a closest-surface distance certificate. Nonfinite input, conflicting
   * bounds, invalid IDs, exhausted raw term budgets, nonfinite duplicate sums
   * or nonrepresentable number views throw atomically.
   */

  export type Operation = (input: {
    /** Constant part of the substituted position row, millimetres. */
    constantMm: readonly [number, number, number];

    /**
     * Original independent IDs and dimensionless weights; repeated IDs combine
     * in input order.
     */
    terms: readonly {
      /**
       * Zero-based ordinal in this record's owning cell, component or control
       * registry; it is not a source coordinate.
       */
      id: number;
      /**
       * Dimensionless signed affine coefficient; neither positivity nor
       * convexity is inferred.
       */
      weight: number;
    }[];

    /** Common independent-control lower bounds, millimetres. */
    lowerMm: readonly [number, number, number];

    /** Common independent-control upper bounds, millimetres. */
    upperMm: readonly [number, number, number];

    /**
     * One private positional observation, millimetres; it need not be inside
     * the box.
     */
    targetMm: readonly [number, number, number];

    /** Positive millimetre tolerance; exact equality is not infeasible. */
    toleranceMm: number;

    /**
     * Positive safe cap on supplied terms, including repeated and canceled
     * addresses.
     */
    maxTerms: number;
  }) => {
    /** Outward-rounded lower endpoints, millimetres. */
    lowerMm: [number, number, number];

    /** Outward-rounded upper endpoints, millimetres. */
    upperMm: [number, number, number];

    /** Approximate distance to the exact row image, millimetres. */
    minimumDistanceMm: number;

    /** Exact strict distance-squared comparison for the combined binary64 row. */
    infeasibleAtTolerance: boolean;

    /** Binary64 sum of combined weights, in first-address order. */
    weightSum: number;

    /** Binary64 sum of absolute combined weights, in first-address order. */
    absoluteWeightSum: number;

    /** Unique original addresses, including exact-zero cancellations. */
    terms: number;

    /** Predicate scope and diagnostic precision qualification. */
    diagnostic: string;
  };
}
