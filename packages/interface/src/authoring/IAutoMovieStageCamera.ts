import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";
import { IAutoMovieCameraClearanceEnvelope } from "../scene/IAutoMovieCameraClearanceEnvelope";
import { IAutoMovieCameraDepthPrecisionConstraint } from "../scene/IAutoMovieCameraDepthPrecisionConstraint";

/**
 * One camera available to the registered shot.
 *
 * `stageScene` lowers it to a scene camera whose level-horizon look basis aims local -Z at the resolved `lookAt` point, using world +Z as the reference near a vertical aim. That is the opening framing; the first `frame` action elects the live camera and authors its move from there.
 *
 * @evidence contracts/common.md#principled-implementation `stageScene` requires finite position, field of view in `(0, 180)` degrees, finite `0 < near < far`, valid depth precision and clearance, and a placed-node or finite-point look target at least `1e-9` m away. lookRotation builds the level-horizon basis rather than a shortest-arc aim; representable target subtraction and normalization remain premises because lowering has no separate rotation-result gate.
 * @evidence contracts/common.md#clear-and-simple-design The record states the lens, clip range, precision demand and opening aim in the stage's own vocabulary; the resolved rotation and lowered envelope belong to the scene camera, so the author never writes a quaternion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A camera aimed at its own position is refused rather than given an arbitrary rotation, and a node `lookAt` resolves to the target's placement point with no per-kind height offset.
 * @evidence contracts/common.md#meaningful-documentation States the id's role, the world frame and units, how `lookAt` resolves and what may be named, the strict field-of-view and clip bounds, and what an omitted clearance means.
 * @author Samchon
 */
export interface IAutoMovieStageCamera {
  /** Non-blank unique scene camera identity that `frame` actions name. */
  node: string;

  /** Finite initial camera position in world metres. */
  position: IAutoMovieVector3;

  /**
   * Opening aim: a placed actor, set piece or camera, which resolves to its placement position, or a finite world point. It must not coincide with {@link position}; later aim comes from `frame` actions.
   */
  lookAt: IAutoMovieNodeTarget | IAutoMoviePointTarget;

  /** Vertical field of view in degrees, strictly between `0` and `180`. */
  fovDeg: number;

  /** Finite positive near clip distance in camera-space metres. */
  near: number;

  /** Finite far clip distance in camera-space metres, greater than `near`. */
  far: number;

  /**
   * Minimum standard depth-buffer bits and greatest adjacent depth step in metres, copied onto the scene camera.
   */
  depthPrecision: IAutoMovieCameraDepthPrecisionConstraint;

  /**
   * Camera-local physical body and optional parent-rig clearance envelopes.
   *
   * Omit only when this authored camera makes no physical-clearance claim. Stage validation refuses malformed centres and non-positive radii before lowering the same envelope onto the resolved scene camera.
   */
  clearance?: IAutoMovieCameraClearanceEnvelope;
}
