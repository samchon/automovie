/**
 * Exact saved-curve span supplying one canonical atlas authority.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Saved coefficient curve identity. Original saved span ordinal within that curve.
 * @evidence contracts/development/design.md#principled-representation Original saved span ordinal within that curve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryAnalyticDomain share IAutoMovieRecoveryCurveBinding's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryCurveBinding {
 
 /** Saved coefficient curve identity. */
  curveName: string;

 
 /** Original saved span ordinal within that curve. */
  span: number;

 
 /** Canonical atlas authority identity referenced by the supplied recipe. */
  authority: string;
}
