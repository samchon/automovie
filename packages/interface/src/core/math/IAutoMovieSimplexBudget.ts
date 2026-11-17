/**
 * Explicit storage, iteration and scalar-visit limits for simplex minimization.
 *
 * @evidence contracts/development/design.md#principled-representation Independent positive safe-integer limits bound retained scalars and each complete aggregate, pricing and pairwise step before it runs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The numerical owner admits these limits without borrowing a native solver's undocumented workspace or iteration policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Budget exhaustion returns a nonconverged certificate and never supplies missing rank or raises a ceiling.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish logical scalar slots, complete pricing passes and conservative coefficient-visit work from bytes and elapsed time.
 */
export interface IAutoMovieSimplexBudget {
  /** Maximum pairwise weight transfers; a final full pricing pass is separate. */
  maxIterations: number;

  /** Maximum simultaneous logical scalar slots including borrowed sparse input. */
  maxEntries: number;

  /** Maximum conservative scalar visits, including admission and final pricing. */
  maxWork: number;
}
