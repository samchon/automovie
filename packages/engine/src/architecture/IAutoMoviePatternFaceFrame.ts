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
