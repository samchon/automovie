/**
 * An admitted open-curve correspondence across two adjacent saved sections.
 *
 * @evidence contracts/development/design.md#principled-representation One local curve ordinal on each side and an endpoint reversal preserve observed incidence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A named pair carries direction without duplicating either curve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source mesh, normal array, positional weld or inferred closure is supplied.
 * @evidence contracts/development/common.md#meaningful-documentation Fields distinguish section and curve ordinals, retained orientation and physical sampling policy.
 */
export interface IAutoMovieRecoveryOpenCurvePair {
  /** Open-curve ordinal in the preceding section report. */
  before: number;

  /** Open-curve ordinal in the following section report. */
  after: number;

  /** Whether the following curve must be reversed relative to its saved direction. */
  reverseAfter: boolean;
}
