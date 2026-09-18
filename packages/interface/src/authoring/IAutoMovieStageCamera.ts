import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";
import { IAutoMovieCameraClearanceEnvelope } from "../scene/IAutoMovieCameraClearanceEnvelope";
import { IAutoMovieCameraDepthPrecisionConstraint } from "../scene/IAutoMovieCameraDepthPrecisionConstraint";

/**
 * One camera available to the registered shot.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `IAutoMovieStageCamera` as the portable data boundary for the agent authoring tool replaceability requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `IAutoMovieStageCamera` for the spec authoring authority compatibility system contract.
 */
export interface IAutoMovieStageCamera {
  /**
   * Unique scene camera identity used by {@code frame} actions.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `node` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `node` for the spec authoring authority compatibility system contract.
   */
  node: string;
  /**
   * Initial camera position in world meters.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `position` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `position` for the spec authoring authority compatibility system contract.
   */
  position: IAutoMovieVector3;
  /**
   * Initial live subject; stage validation requires it to resolve.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `lookAt` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `lookAt` for the spec authoring authority compatibility system contract.
   */
  lookAt: IAutoMovieNodeTarget | IAutoMoviePointTarget;
  /**
   * Vertical field of view in degrees, strictly between zero and 180.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `fovDeg` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `fovDeg` for the spec authoring authority compatibility system contract.
   */
  fovDeg: number;

  /**
   * Positive near clip distance in camera-space metres.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Exposes the authored near boundary instead of accepting a stage-owned constant.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the near operand lowered without substitution into clipping and precision evaluation.
   */
  near: number;

  /**
   * Far clip distance in camera-space metres, strictly greater than `near`.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Exposes the authored far boundary instead of accepting a stage-owned constant.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the far operand lowered without substitution into clipping and precision evaluation.
   */
  far: number;

  /**
   * Minimum standard depth capability and maximum adjacent step in metres.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Makes precision acceptance an authored numeric boundary rather than an inferred renderer default.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the precision constraint lowered onto the resolved camera and evaluated against current required bounds.
   */
  depthPrecision: IAutoMovieCameraDepthPrecisionConstraint;

  /**
   * Camera-local physical body and optional parent-rig clearance envelopes.
   *
   * Omit only when this authored camera makes no physical-clearance claim.
   * Stage validation refuses malformed centres and non-positive radii before
   * lowering the same envelope onto the resolved scene camera.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clearance Exposes the authored camera and rig bodies whose scene penetration must be refused.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Types the physical input lowered into swept-path evaluation.
   */
  clearance?: IAutoMovieCameraClearanceEnvelope;
}
