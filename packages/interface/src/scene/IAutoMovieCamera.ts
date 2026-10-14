import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieCameraClearanceEnvelope } from "./IAutoMovieCameraClearanceEnvelope";
import { IAutoMovieCameraDepthPrecisionConstraint } from "./IAutoMovieCameraDepthPrecisionConstraint";

/**
 * A perspective camera: the viewpoint a frame is rendered from.
 *
 * The camera is what turns a posed scene into the image/video output that motivates automovie as a diffusion alternative: place the rig, place the camera, and the deterministic renderer bakes the frame. Fields map onto `three.js` `PerspectiveCamera`.
 *
 * Near and far are the camera's authored clipping fields. Arbitrary section planes belong to inspection through IAutoMovieSectionPlane and the engine/viewer section helpers; their cutaway views are not evidence of the delivered shot. An authored plane reopens only when a production must deliver a cutaway shot, with explicit clipped-subject readability and consistent outline, mask and depth behavior.
 *
 * Inspection cuts leave open shells. Solid capping requires watertight boolean geometry and cap materials beyond this viewing operation; it reopens with delivered cutaway frames whose contract needs a solid section.
 *
 * @evidence contracts/common.md#principled-implementation World TRS and perspective field/clip parameters define the film camera, while explicit standard depth precision and optional physical clearance contracts are evaluated against the current scene before take publication.
 * @evidence contracts/common.md#clear-and-simple-design Delivery viewpoint and its physical constraints stay on the camera; inspection-owned section planes remain separate because their cutaway observations are not delivered-shot evidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Near must be positive and far exceed near, missing depth capability cannot be assumed, and a cutaway inspection cannot satisfy film visibility by removing an authored wall.
 * @evidence contracts/common.md#meaningful-documentation Defines world placement and local viewing direction, degree FOV, meter clips, explicit depth precision, optional legacy clearance and inspection-only cutaways.
 * @author Samchon
 */
export interface IAutoMovieCamera {
  /** Stable id. */
  id: string;

  /**
   * World placement of the camera (it looks down its local −Z, glTF convention).
   */
  transform: IAutoMovieTransform;

  /** Vertical field of view in degrees, `(0, 180)`. */
  fovY: number;

  /** Near clip plane distance, meters. */
  near: number;

  /** Far clip plane distance, meters. Must exceed `near`. */
  far: number;

  /**
   * Required standard depth-buffer capability and accepted quantization step.
   */
  depthPrecision: IAutoMovieCameraDepthPrecisionConstraint;

  /**
   * Physical camera-body and optional parent-rig clearance envelopes.
   *
   * Optional for legacy scenes. When present, a shot builder must evaluate this camera on the current scene revision before publishing the take.
   */
  clearance?: IAutoMovieCameraClearanceEnvelope;
}
