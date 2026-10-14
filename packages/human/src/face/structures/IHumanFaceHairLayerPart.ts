import type { IAutoMovieHumanFaceHair } from "./IAutoMovieHumanFaceHair";

/**
 * Continuous parting field in the connected layer's neutral head frame.
 * The normalized plane, optional Gaussian root envelope and arc decay preserve
 * the existing authored comb convention without a private parting curve.
 *
 * @evidence contracts/common.md#principled-implementation Signed distance to the normalized head-frame plane feeds a tanh side field; tangent-projected bias is weighted by exponential arc decay and an optional neutral-root Gaussian envelope.
 * @evidence contracts/common.md#clear-and-simple-design Plane, transition and bias coefficients stay with one layer field; the optional region references the existing shared envelope representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This authored smooth direction field does not guarantee that guide interpolation stays on one side; the interpolator's empty-side fallback remains explicit in the guide contract.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish metre offsets/width/reach from dimensionless vectors/strength and locate the optional region in neutral root space.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Plane/bias coefficients and an optional region perform no tanh evaluation or Gaussian envelope calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The part record defines no root-side cache or current-field invalidation; consumers derive those from admitted layer inputs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources These values create no private guide curve or retained query; actual field closures belong to the owning evaluation.
 * @author Samchon
 */
export interface IHumanFaceHairLayerPart {
  /** Nonzero plane normal, normalized by the field owner. */
  normal: [number, number, number];

  /** Signed plane offset from the neutral origin, metres. */
  offset: number;

  /** Positive tanh transition width, metres. */
  transitionWidth: number;

  /** Dimensionless direction bias projected into the local tangent. */
  bias: [number, number, number];

  /** Nonnegative relative direction weight. */
  strength: number;

  /** Positive exponential decay distance along the lock, metres. */
  reach: number;

  /** Optional neutral root-space Gaussian envelope. */
  region?: IAutoMovieHumanFaceHair.Region;
}
