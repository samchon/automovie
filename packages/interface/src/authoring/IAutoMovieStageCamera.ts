import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";
import { IAutoMovieCameraClearanceEnvelope } from "../scene/IAutoMovieCameraClearanceEnvelope";
import { IAutoMovieCameraDepthPrecisionConstraint } from "../scene/IAutoMovieCameraDepthPrecisionConstraint";

/**
 * One camera available to the registered shot.
 *
 * `stageScene` lowers it to a scene camera whose rotation aims its local -Z at
 * the resolved `lookAt` point. That aim is only the opening framing: the
 * first `frame` action elects the live camera and authors its move from there.
 *
 * @evidence contracts/common.md#principled-implementation `stageScene` requires a finite position, a field of view strictly inside `(0, 180)` degrees, a finite `near > 0`, a finite `far > near`, a valid depth-precision record, a `lookAt` that resolves to a placed actor, set piece or camera position or a finite point at least `1e-9` m from the camera, and a well-formed clearance envelope; the aim is the shortest-arc rotation from -Z to the target direction.
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
