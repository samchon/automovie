import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";
import { IAutoMovieCameraClearanceEnvelope } from "../scene/IAutoMovieCameraClearanceEnvelope";
import { IAutoMovieCameraDepthPrecisionConstraint } from "../scene/IAutoMovieCameraDepthPrecisionConstraint";

/**
 * One camera available to the registered shot.
 *
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
