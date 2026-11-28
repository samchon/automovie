/** Numerical observations shared by strict-piece and cubic length readers. */
export namespace IAutoMovieCurveLengthQuadrature64 {
  /**
   * Composite K- and 2K-panel observations from original derivatives in
   * millimetres per source parameter unit. The strict piece reader requests
   * endpoint checks as well as interior nodes. The cubic reader uses interior
   * nodes. Arithmetic flags accompany the sums so each reader can apply its own
   * admission policy. Callback exceptions propagate. The two-panel populations
   * can miss the same features.
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
