/**
 * An admitted open-curve correspondence across two adjacent saved sections.
 *
 * @evidence contracts/common.md#principled-implementation One local curve ordinal on each side and an endpoint reversal preserve observed incidence.
 * @evidence contracts/common.md#clear-and-simple-design A named pair carries direction without duplicating either curve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, normal array, positional weld or inferred closure is supplied.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish section and curve ordinals, retained orientation and physical sampling policy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural record performs no observation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the records and arrays.
 */
export interface IAutoMovieRecoveryOpenCurvePair {
  /** Open-curve ordinal in the preceding section report. */
  before: number;

  /** Open-curve ordinal in the following section report. */
  after: number;

  /** Whether the following curve must be reversed relative to its saved direction. */
  reverseAfter: boolean;
}
