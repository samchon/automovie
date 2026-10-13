import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The visible eye's spherical curvature basis, in construction millimetres. A fitted surface radius is a portrait control, not a measured globe diameter.
 *
 * @evidence contracts/common.md#principled-implementation A centre and positive radius describe the admitted spherical cap used by scalar +Z and view-direction intersection readers in one millimetre frame.
 * @evidence contracts/common.md#clear-and-simple-design Curvature representation is separate from lid fitting, gaze rotation and emitted eye layers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This portrait radius is not a clinically measured globe diameter and the descriptor alone admits no collision or anatomical reconstruction.
 * @evidence contracts/common.md#meaningful-documentation Members specify the millimetre centre/radius and distinguish fitted visible curvature from measured globe anatomy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Centre and radius describe curvature without performing a fit, height query or intersection calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This sphere descriptor implements no eye-query cache or fit invalidation policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no emitted eye layers or mesh handles; its fit producer owns the returned vector/scalar values.
 * @author Samchon
 */
export interface IPortraitEyeSphere {
  /** Sphere centre behind the fitted lid opening. */
  center: IAutoMovieVector3;

  /** Positive spherical surface radius in millimetres. */
  radius: number;
}
