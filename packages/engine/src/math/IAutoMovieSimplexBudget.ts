/**
 * Explicit storage, iteration and scalar-visit limits for simplex minimization.
 *
 * @evidence contracts/common.md#principled-implementation Independent positive safe-integer limits bound retained scalars and each complete aggregate, pricing and pairwise step before it runs.
 * @evidence contracts/common.md#clear-and-simple-design The numerical owner admits these limits without borrowing a native solver's undocumented workspace or iteration policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Budget exhaustion returns a nonconverged certificate and never supplies missing rank or raises a ceiling.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish logical scalar slots, complete pricing passes and conservative coefficient-visit work from bytes and elapsed time.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no numerical work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar limits acquire no resource.
 */
export interface IAutoMovieSimplexBudget {
  /** Maximum pairwise weight transfers; a final full pricing pass is separate. */
  maxIterations: number;

  /** Maximum simultaneous logical scalar slots including borrowed sparse input. */
  maxEntries: number;

  /** Maximum conservative scalar visits, including admission and final pricing. */
  maxWork: number;
}
