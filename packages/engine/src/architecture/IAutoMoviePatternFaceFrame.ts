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
 * @evidence contracts/common.md#principled-implementation An orthonormal world basis with an origin: a face point maps to `origin + u·U + v·V`, and the normal is `U × V`, the right-handed convention that decides which side instances face.
 * @evidence contracts/common.md#clear-and-simple-design Three vectors are the minimum to place a plane with a handedness; the normal is derived rather than stored, so it cannot disagree with the axes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-unit or non-perpendicular axes are refused with a `1e-6` tolerance rather than normalized silently, so a skewed frame cannot shear every slot.
 * @evidence contracts/common.md#meaningful-documentation States the mapping formula, the derived normal and its effect on facing, and each refusal with its tolerance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; checking a frame is constant time once per call or facet, answered on `autoMoviePatternInstanceTransforms`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resolved once per call or facet into a basis shared by every occurrence placed on it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three caller-owned vectors; the resolved basis aliases `origin` and the axes only during the call.
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
