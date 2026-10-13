import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Exact inspection camera state that produced one subject observation.
 *
 * @author Samchon
 */
export interface IAutoMovieSubjectReviewPose {
  /** Coordinate basis shared by the eye and target. */
  coordinateSpace: "model" | "world";

  /** Eye position in metres. */
  position: IAutoMovieVector3;

  /** Point the eye looks at, in metres. */
  target: IAutoMovieVector3;

  /** Vertical field of view in degrees. */
  fovDeg: number;

  /** Viewport width divided by height. */
  aspect: number;

  /** Near clip distance in metres. */
  near: number;

  /** Far clip distance in metres. */
  far: number;
}
