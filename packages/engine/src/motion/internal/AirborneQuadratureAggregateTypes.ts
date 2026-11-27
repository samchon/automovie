/** Type contracts shared by the private adaptive quadrature implementation. */
export namespace AirborneQuadratureAggregateTypes {
  /**
   * Actual numeric panel data used by the aggregation algorithm.
   *
   * Start seconds order ties; value and absolute error use the integrand's
   * output coordinates. Reuses the actual quadrature panel's numeric estimates
   * without physical or action vocabulary. The aggregate needs only time
   * ordering, values and error components, while the panel producer retains its
   * own sample data. No guessed curve, body identity or success marker enters
   * the panel contract.
   */
  export interface IPanel {
    /** First second, ordering exact-score ties. */
    a: number;
    /** Finite corrected integral coordinates. */
    value: readonly number[];
    /** Absolute componentwise truncation estimates. */
    error: readonly number[];
  }

  /**
   * A fresh integral snapshot and borrowed roundoff for one current tree state.
   *
   * Values and additional aggregation roundoff retain the original output
   * units; value is a fresh snapshot and roundoff is borrowed until the next
   * replacement. Separates numerical accumulation error from the panel
   * truncation estimator instead of hiding it in a physical tolerance. The
   * quadrature caller uses both arrays only while judging the current integral.
   * Neither borrowed array can certify a continuous integrand or final flight
   * error.
   */
  export interface IRead {
    /**
     * Fresh snapshot of the current pairwise integral sum, read-only for
     * callbacks.
     */
    value: readonly number[];
    /** Outward bound on new aggregate-addition roundoff, in the same units. */
    roundoff: readonly number[];
  }

  /**
   * Current-value reads, current-weight priorities and local panel replacement.
   *
   * Each operation states its borrowed result, nonnegative weights or actual
   * panel ownership. One tree represents the current live binary partition;
   * replacement keeps actual children and drops their former parent leaf. The
   * adaptive quadrature consumes all four members to read, judge, select and
   * refine the current partition. A priority query always receives the current
   * weights; there is no stale-score cache or test-only counter.
   */
  export interface ITree<Panel extends IPanel> {
    /**
     * Copy the current integral and borrow its roundoff until the next
     * replacement.
     */
    read(): IRead;
    /**
     * Enclose the sum of current weighted panel measures and the
     * caller-measured additional aggregation roundoff, all in the same output
     * unit.
     */
    estimate(weights: readonly number[], roundoff: number): number;
    /** Select the true maximum for current weights, with earlier-time ties. */
    worst(weights: readonly number[]): Panel;
    /** Replace exactly one live panel by its actual two children. */
    replace(previous: Panel, left: Panel, right: Panel): void;
  }
}
