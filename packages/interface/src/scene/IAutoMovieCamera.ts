import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieCameraClearanceEnvelope } from "./IAutoMovieCameraClearanceEnvelope";
import { IAutoMovieCameraDepthPrecisionConstraint } from "./IAutoMovieCameraDepthPrecisionConstraint";

/**
 * A perspective camera: the viewpoint a frame is rendered from.
 *
 * The camera is what turns a posed scene into the image/video output that
 * motivates automovie as a diffusion alternative: place the rig, place the
 * camera, and the deterministic renderer bakes the frame. Fields map onto
 * `three.js` `PerspectiveCamera`.
 *
 * **An arbitrary clipping plane is deliberately not a field here.** `near` and
 * `far` are the only clipping this camera declares, and a cutaway — the cut
 * that removes a roof or a wall so a floor plan can be read in one image — is
 * owned by inspection instead (`IAutoMovieSectionPlane` and
 * `classifyAutoMovieSectionPlaneBox` in `@automovie/engine`,
 * `applyAutoMovieSectionPlanes` in `@automovie/viewer`). The reason is which
 * picture is on trial: a shot is judged on the image it delivers, so an
 * observation made after a wall was removed is a diagram about the production
 * and not evidence about that image, exactly as the subject-review surface
 * already says of an angle the work did not author. Admitting a plane here
 * would also make delivery acceptance depend on it — a required subject sliced
 * in half could no longer be counted as read — and would oblige every guide
 * pass to agree on the same section, all of it paid in the delivery lane for a
 * frame nothing delivers. It reopens the day a production must deliver a
 * cutaway AS a shot; at that point the plane becomes an authored field here,
 * `realizeShotContract` must count clipped-away subjects as unreadable, and the
 * `outline`, `mask` and `depth` passes must be shown to cut identically.
 *
 * **Nothing fills the exposed section either.** A cut wall reads as an open
 * shell rather than a solid, because capping it is a boolean against watertight
 * solids and a new cap material per mesh — a modelling operation, not a viewing
 * one — while a blocking-pass reviewer is reading placement, extent and
 * clearance, which an open shell shows correctly. That reopens with the same
 * condition: a delivered cutaway frame, where a hollow shell would be a defect.
 *
 * @evidence requirements/camera/projection-lens-and-sensor.md#camera-focal-fov Exposes `IAutoMovieCamera` as the portable data boundary for the camera focal fov requirement.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-lens-basis-consistency Types `IAutoMovieCamera` for the clv lens basis consistency system contract.
 * @author Samchon
 */
export interface IAutoMovieCamera {
  /**
   * Stable id.
   *
   * @evidence requirements/camera/projection-lens-and-sensor.md#camera-focal-fov Exposes `id` as the portable data boundary for the camera focal fov requirement.
   * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-lens-basis-consistency Types `id` for the clv lens basis consistency system contract.
   */
  id: string;

  /**
   * World placement of the camera (it looks down its local −Z, glTF
   * convention).
   *
   * @evidence requirements/camera/projection-lens-and-sensor.md#camera-focal-fov Exposes `transform` as the portable data boundary for the camera focal fov requirement.
   * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-lens-basis-consistency Types `transform` for the clv lens basis consistency system contract.
   */
  transform: IAutoMovieTransform;

  /**
   * Vertical field of view in degrees, `(0, 180)`.
   *
   * @evidence requirements/camera/projection-lens-and-sensor.md#camera-focal-fov Exposes `fovY` as the portable data boundary for the camera focal fov requirement.
   * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-lens-basis-consistency Types `fovY` for the clv lens basis consistency system contract.
   */
  fovY: number;

  /**
   * Near clip plane distance, meters.
   *
   * @evidence requirements/camera/projection-lens-and-sensor.md#camera-focal-fov Exposes `near` as the portable data boundary for the camera focal fov requirement.
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Carries the positive authored near boundary used by clipping and depth precision evaluation.
   * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-lens-basis-consistency Types `near` for the clv lens basis consistency system contract.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Supplies the report's near clipping operand in camera-space metres.
   */
  near: number;

  /**
   * Far clip plane distance, meters. Must exceed `near`.
   *
   * @evidence requirements/camera/projection-lens-and-sensor.md#camera-focal-fov Exposes `far` as the portable data boundary for the camera focal fov requirement.
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Carries the ordered authored far boundary used by clipping and depth precision evaluation.
   * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-lens-basis-consistency Types `far` for the clv lens basis consistency system contract.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Supplies the report's far clipping operand in camera-space metres.
   */
  far: number;

  /**
   * Required standard depth-buffer capability and accepted quantization step.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Carries the measurable precision declaration applied to current required subject and environment bounds.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Supplies the minimum bit capability and metre-valued accepted boundary for the deterministic report.
   */
  depthPrecision: IAutoMovieCameraDepthPrecisionConstraint;

  /**
   * Physical camera-body and optional parent-rig clearance envelopes.
   *
   * Optional for legacy scenes. When present, a shot builder must evaluate
   * this camera on the current scene revision before publishing the take.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clearance Carries the declared physical body and support volumes into the resolved scene.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Supplies the envelopes consumed by deterministic swept-path refusal.
   */
  clearance?: IAutoMovieCameraClearanceEnvelope;
}
