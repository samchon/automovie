import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The world placement of the face a pattern was laid on.
 *
 * A face-local point `(u, v)` lands at `origin + u·U + v·V`, and the face
 * normal, which instance `+Z` follows, is `U × V`, so the axis order decides
 * which side the instances face. `autoMoviePatternInstanceTransforms` throws on
 * a non-finite value, an axis whose length differs from one by more than
 * `1e-6`, and axes whose dot product exceeds `1e-6`.
 *
 * @evidence contracts/common.md#principled-implementation An origin plus two orthonormal in-plane axes, an affine chart from face-local metres to world space with the normal given by their cross product.
 * @evidence contracts/common.md#clear-and-simple-design Stores no normal, because a third vector could disagree with `U × V`; the frame states only what cannot be derived.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Orthonormality is checked within `1e-6` and never repaired by re-orthogonalizing, so a skewed authored frame is refused rather than silently corrected.
 * @evidence contracts/common.md#meaningful-documentation States the point mapping, the normal and its handedness, the tolerance checks, and the consumer that applies them.
 * @evidenceExclude contracts/performance.md#cost-and-resources Three vectors resolved once per instancing call and read for every occurrence on the main face; the resolved basis references the caller's origin and is dropped on return.
 * @author Samchon
 */
export interface IAutoMoviePatternFaceFrame {
  /** World point the face-local origin sits at. */
  origin: IAutoMovieVector3;

  /** Unit world direction of the face-local U axis. */
  u: IAutoMovieVector3;

  /** Unit world direction of the face-local V axis, perpendicular to U. */
  v: IAutoMovieVector3;
}
