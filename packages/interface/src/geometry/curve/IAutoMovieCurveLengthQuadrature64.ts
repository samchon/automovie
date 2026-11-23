/** Data and callback contracts shared by the CurveLengthQuadrature64 operations. */
export namespace IAutoMovieCurveLengthQuadrature64 {
  /**
   * Observe two bounded composite rules without choosing the public policy.
   * Callers admit nonempty pieces, finite increasing representable domains and
   * integer K in [1,1024]. Derivatives use mm per domain-parameter unit. Zero
   * speed is valid. Endpoint reads are requested only by the strict owner; the
   * legacy cubic owner keeps its original interior-only finite-final test.
   * Callback exceptions propagate, while arithmetic observations accompany the
   * actual computed coarse/fine sums. Their difference is not an error bound.
   */
  export type IMeasureResult = {
    /** K-panel computed sum, mm. */
    coarseMm: number;
    /** K*2-panel computed sum, mm. */
    fineMm: number;
    /** A requested derivative component or its norm was nonfinite. */
    nonfiniteDerivative: boolean;
    /** A positive speed produced a zero weighted contribution. */
    underflowingContribution: boolean;
    /** A weighted contribution was nonfinite. */
    nonfiniteContribution: boolean;
    /** A mapped node was not strictly inside its panel. */
    collapsedNode: boolean;
  };
}
