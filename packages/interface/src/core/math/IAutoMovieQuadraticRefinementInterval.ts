/**
 * The intersection of every row of a quadratic program that has exactly the
 * same sparse coefficients, as `refineAutoMovieQuadraticProgram` groups them
 * for polishing.
 *
 * Rows join a group only when their sorted index and weight pairs are
 * identical; proportional or differently signed rows stay separate. The group
 * keeps the strongest finite lower and upper endpoints and the first row that
 * set each, which is the row an active endpoint's multiplier is returned to.
 * Every member stays in the final full-row admission, so grouping removes no
 * constraint. An empty intersection throws while grouping.
 */
export interface IAutoMovieQuadraticRefinementInterval {
  /** Variable indices of the shared coefficients, ascending. */
  indices: number[];

  /** Coefficients paired with `indices`, including exact zeros. */
  weights: number[];

  /** Largest finite lower endpoint among the members, or `null` if none. */
  lower: number | null;

  /** Smallest finite upper endpoint among the members, or `null` if none. */
  upper: number | null;

  /** First member row whose lower endpoint is `lower`; -1 when unbounded. */
  lowerOwner: number;

  /** First member row whose upper endpoint is `upper`; -1 when unbounded. */
  upperOwner: number;

  /** Original row numbers of every member, in program order. */
  originals: number[];
}
