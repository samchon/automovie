import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";
import { IAutoMovieCameraClearanceEnvelope } from "../scene/IAutoMovieCameraClearanceEnvelope";
import { IAutoMovieCameraDepthPrecisionConstraint } from "../scene/IAutoMovieCameraDepthPrecisionConstraint";

/**
 * One camera available to the registered shot.
 *
 * @evidence contracts/common.md#principled-implementation `stageScene` resolves `lookAt` to a point once and aims the camera's -Z there with the shortest-arc `lookRotation`, after refusing a non-finite position, a field of view outside (0, 180), a non-positive near, a far not above near, and a target equal to the position.
 * @evidence contracts/common.md#clear-and-simple-design Lens, clip and depth-precision facts live on the staged camera so `stageScene` copies them straight onto the scene camera; `clearance` is optional because only a camera claiming a physical body needs an envelope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A node target may name another camera, matching the placement table `performShot` resolves against, and a camera aimed at itself is refused through the zero-length look vector rather than an id comparison.
 * @evidence contracts/common.md#meaningful-documentation Documents degrees, metres, the camera-space frame of the clip distances, that `lookAt` only sets the initial aim, and when `clearance` may be omitted.
 * @author Samchon
 */
export interface IAutoMovieStageCamera {
  /** Unique scene camera identity used by {@code frame} actions. */
  node: string;

  /** Initial camera position in world meters. */
  position: IAutoMovieVector3;

  /**
   * Initial aim: a placed actor, set piece or camera, or a finite world point.
   * Staging resolves it to one fixed point; later aim comes from `frame`
   * actions.
   */
  lookAt: IAutoMovieNodeTarget | IAutoMoviePointTarget;

  /** Vertical field of view in degrees, strictly between zero and 180. */
  fovDeg: number;

  /** Positive near clip distance in camera-space metres. */
  near: number;

  /** Far clip distance in camera-space metres, strictly greater than `near`. */
  far: number;

  /** Minimum standard depth capability and maximum adjacent step in metres. */
  depthPrecision: IAutoMovieCameraDepthPrecisionConstraint;

  /**
   * Camera-local physical body and optional parent-rig clearance envelopes.
   *
   * Omit only when this authored camera makes no physical-clearance claim.
   * Stage validation refuses malformed centres and non-positive radii before
   * lowering the same envelope onto the resolved scene camera.
   */
  clearance?: IAutoMovieCameraClearanceEnvelope;
}
