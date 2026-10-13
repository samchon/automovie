import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The reference ground as one plane.
 *
 * The plane is the datum an analysis measures the horizon against, and
 * deliberately not a terrain: landscape, roads and natural water are outside
 * the building scope.
 *
 * The current solvers read only {@link up}. The daylight solver counts a ray as
 * seeing ground when its direction has a non-positive dot product with the
 * normalized `up`, which is a horizon through each sample point; it never
 * compares a sample's position with {@link elevation}.
 */
export interface IAutoMovieReferenceGround {
  /** World direction pointing from the ground into the sky; non-zero. */
  up: IAutoMovieVector3;

  /**
   * Plane constant in metres, read as `dot(normalize(up), point) = elevation`.
   * A point is above ground when its projection exceeds this value. No solver
   * evaluates this test yet.
   */
  elevation: number;
}
