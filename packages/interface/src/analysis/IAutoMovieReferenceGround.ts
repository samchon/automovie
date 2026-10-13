import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The reference ground as one plane.
 *
 * A ray that leaves a sample below this plane sees ground, not sky. The plane
 * is the datum an analysis measures the horizon against, and deliberately not a
 * terrain: landscape, roads and natural water are outside the building scope.
 */
export interface IAutoMovieReferenceGround {
  /** World direction pointing from the ground into the sky; non-zero. */
  up: IAutoMovieVector3;

  /**
   * Plane constant in metres, read as `dot(normalize(up), point) = elevation`.
   * A point is above ground when its projection exceeds this value.
   */
  elevation: number;
}
