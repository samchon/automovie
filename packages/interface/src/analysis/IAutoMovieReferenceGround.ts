import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The reference ground as one plane.
 *
 * This analysis datum defines the horizon; it does not represent landscape,
 * roads or water surfaces, whose authored geometry belongs to their own scene
 * and domain records.
 *
 * The current solvers read only {@link up}. The daylight solver counts a ray as
 * seeing ground when its direction has a non-positive dot product with the
 * normalized `up`, which is a horizon through each sample point; it never
 * compares a sample's position with {@link elevation}.
 */
export interface IAutoMovieReferenceGround {
  /** World direction pointing from the ground into the sky; finite, non-zero. */
  up: IAutoMovieVector3;

  /**
   * Finite plane constant in metres, read as `dot(normalize(up), point) =
   * elevation`. A point is above ground when its projection exceeds this value.
   * No solver evaluates this test yet.
   */
  elevation: number;
}
