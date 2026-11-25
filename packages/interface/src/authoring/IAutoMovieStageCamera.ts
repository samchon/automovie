import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import type { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";
import type { IAutoMovieCameraClearanceEnvelope } from "../scene/IAutoMovieCameraClearanceEnvelope";
import type { IAutoMovieCameraDepthPrecisionConstraint } from "../scene/IAutoMovieCameraDepthPrecisionConstraint";

/**
 * One camera available to the registered shot.
 *
 * `stageScene` lowers it to a scene camera whose level-horizon look basis aims
 * local -Z at the resolved `lookAt` point, using world +Z as the reference near
 * a vertical aim. That is the opening framing; the first `frame` action elects
 * the live camera and authors its move from there.
 */
export interface IAutoMovieStageCamera {
  /** Unique scene camera identity that `frame` actions name. */
  node: string;

  /** Finite initial camera position in world metres. */
  position: IAutoMovieVector3;

  /**
   * Opening aim: a placed actor, set piece or camera, which resolves to its
   * placement position, or a finite world point. It must not coincide with
   * {@link position}; later aim comes from `frame` actions.
   */
  lookAt: IAutoMovieNodeTarget | IAutoMoviePointTarget;

  /** Vertical field of view in degrees, strictly between `0` and `180`. */
  fovDeg: number;

  /** Finite positive near clip distance in camera-space metres. */
  near: number;

  /** Finite far clip distance in camera-space metres, greater than `near`. */
  far: number;

  /**
   * Minimum standard depth-buffer bits and greatest adjacent depth step in
   * metres, copied onto the scene camera.
   */
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
