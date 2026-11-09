import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Exact inspection camera state that produced one subject observation.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit eye and look-at positions plus perspective projection scalars describe a capture camera in the declared model or world meter basis; callers own camera application and any plan digest that incorporates these poses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One camera state keeps position, target and projection parameters together without adopting the work's shot camera or storing renderer objects.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This pose shape is perspective-oriented and does not encode an orthographic span; declaring an orthographic viewpoint elsewhere does not establish an implemented orthographic capture path.
 * @evidence contracts/development/common.md#meaningful-documentation Defines shared coordinate basis, meter positions and clip distances, degree vertical field of view and width-to-height aspect.
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
