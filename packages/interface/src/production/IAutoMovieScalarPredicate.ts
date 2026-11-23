/** A finite scalar comparison applied to a measured shot-contract fact. */
export interface IAutoMovieScalarPredicate {
  /** Numeric comparison. */
  operator: "<=" | ">=" | "==";

  /** Finite expected value in the unit implied by the selected predicate. */
  value: number;

  /** Finite non-negative absolute comparison tolerance. */
  tolerance: number;
}
