/**
 * Exact saved-curve span supplying one canonical atlas authority.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing saved coefficient, ownership and observation contract without transformation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This independent record exposes the actual reconstruction input shared by its producer and consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration admits no source mesh, inferred observations or replacement geometry.
 * @evidence contracts/development/common.md#meaningful-documentation Members state identity, physical units, optional presence and qualification boundaries.
 */
export interface IAutoMovieRecoveryCurveBinding {
  /** Saved coefficient curve identity. */
  curveName: string;

  /** Original saved span ordinal within that curve. */
  span: number;

  /** Canonical atlas authority identity referenced by the supplied recipe. */
  authority: string;
}
