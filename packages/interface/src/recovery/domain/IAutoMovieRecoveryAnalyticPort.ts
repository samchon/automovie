/**
 * A named saved curve occupying one oriented end of an analytic domain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Saved coefficient curve identity. Lower or upper end in the declared native chart; not a world-space height classification.
 * @evidence contracts/development/design.md#principled-representation A named saved curve occupying one oriented end of an analytic domain.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryAnalyticDomain share IAutoMovieRecoveryAnalyticPort's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Lower or upper end in the declared native chart; not a world-space height classification.
 */

export interface IAutoMovieRecoveryAnalyticPort {
  /** Saved coefficient curve identity. */
  curveName: string;

  /** Lower or upper end in the declared native chart; not a world-space height classification. */
  side: "lower" | "upper";
}
