/** Exact saved-curve span supplying one canonical atlas authority. */

export interface IAutoMovieRecoveryCurveBinding {
  /** Saved coefficient curve identity. */
  curveName: string;

  /** Original saved span ordinal within that curve. */
  span: number;

  /** Canonical atlas authority identity referenced by the supplied recipe. */
  authority: string;
}
