import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The reference ground as one plane.
 *
 * This analysis datum defines the horizon; it does not represent landscape, roads or water surfaces, whose authored geometry belongs to their own scene and domain records.
 *
 * The current solvers read only {@link up}. The daylight solver counts a ray as
 * seeing ground when its direction has a non-positive dot product with the
 * normalized `up`, which is a horizon through each sample point; it never
 * compares a sample's position with {@link elevation}.
 *
 * @evidence contracts/common.md#principled-implementation A plane in normal-offset form; `autoMovieSkyward` tests `dot(direction, normalize(up)) > 0`, and `validateAutoMovieEnvironmentContext` requires a finite `up` longer than `1e-12` and a finite elevation.
 * @evidence contracts/common.md#clear-and-simple-design One direction and one offset define the analysis reference; terrain geometry and materials stay with their scene owners instead of being duplicated here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The horizon is taken through each sample point rather than at the stated elevation, which the documentation names as the current limitation instead of implying a height test that no solver performs.
 * @evidence contracts/common.md#meaningful-documentation States the plane's role, the scope exclusion, which field the solvers read, the exact ground-ray test, the elevation equation and unit, and that elevation is not yet evaluated.
 */
export interface IAutoMovieReferenceGround {
  /** World direction pointing from the ground into the sky; finite, non-zero. */
  up: IAutoMovieVector3;

  /**
   * Finite plane constant in metres, read as
   * `dot(normalize(up), point) = elevation`. A point is above ground when its
   * projection exceeds this value. No solver evaluates this test yet.
   */
  elevation: number;
}
