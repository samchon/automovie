/** Explicit storage, iteration and scalar-visit limits for simplex minimization. */
export interface IAutoMovieSimplexBudget {
  /** Maximum pairwise weight transfers; a final full pricing pass is separate. */
  maxIterations: number;

  /** Maximum simultaneous logical scalar slots including borrowed sparse input. */
  maxEntries: number;

  /** Maximum conservative scalar visits, including admission and final pricing. */
  maxWork: number;
}
