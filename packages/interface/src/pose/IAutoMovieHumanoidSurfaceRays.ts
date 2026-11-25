import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A point where a ray leaves a segment's colliders, with their outward normal
 * there.
 */
export namespace IAutoMovieHumanoidSurfaceRays {
  /**
   * A point where a ray leaves a segment's colliders, with their outward normal
   * there.
   */
  export interface ISurfacePoint {
    /** The point, world metres in the rest pose. */
    point: IAutoMovieVector3;

    /** The outward unit normal there. */
    normal: IAutoMovieVector3;
  }
}
