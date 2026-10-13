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
 *
 * @evidence contracts/common.md#principled-implementation A plane given as an up direction and an offset along its normalized direction; `autoMovieSkyward` and the sun-below-horizon validation rule both use the direction only, treating the horizon as passing through the point being evaluated.
 * @evidence contracts/common.md#clear-and-simple-design A single plane instead of terrain keeps landscape out of the building scope, and the record has two fields with no tilt, extent or material option.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `elevation` is validated finite and digested into daylight settings, yet no solver tests a sample against it, so a sample below the declared ground still sees sky in every upward direction; that unused field is stated, not compensated.
 * @evidence contracts/common.md#meaningful-documentation States the plane equation, the up orientation, the metre unit of the elevation, and which part of the plane the current solvers actually read.
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
