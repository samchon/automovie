import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * The camera is an actor; this is how it moves. A _list_ of camera actions
 * composes a move that changes mid-shot ("follow the charge, then hold static
 * on the fall"). The engine realises the framing/move against the target as a
 * camera-node clip (`cameraMotion` on the shot).
 *
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-refusal Exposes `IAutoMovieCameraAction` as the portable data boundary for the camera target refusal requirement.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-diagnostics-refusal Types `IAutoMovieCameraAction` for the clv focus diagnostics refusal system contract.
 */
export interface IAutoMovieCameraAction extends IAutoMovieActionBase {
  /**
   * Selects camera framing as the action family.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-framing-source-trace This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations This action member carries the cited authoring intent in the typed action contract.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-refusal Exposes `verb` as the portable data boundary for the camera target refusal requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-diagnostics-refusal Types `verb` for the clv focus diagnostics refusal system contract.
   */
  verb: "frame";

  /**
   * How tight the framing is.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-refusal Exposes `framing` as the portable data boundary for the camera target refusal requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-diagnostics-refusal Types `framing` for the clv focus diagnostics refusal system contract.
   */
  framing: "wide" | "full" | "medium" | "close";

  /**
   * How the camera behaves over this span.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-refusal Exposes `move` as the portable data boundary for the camera target refusal requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-diagnostics-refusal Types `move` for the clv focus diagnostics refusal system contract.
   */
  move: "static" | "follow" | "orbit" | "push-in" | "truck" | "whip";

  /**
   * What it frames/tracks.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-refusal Exposes `on` as the portable data boundary for the camera target refusal requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-diagnostics-refusal Types `on` for the clv focus diagnostics refusal system contract.
   */
  on: IAutoMovieActionTarget;

  /**
   * What the lens holds sharp, when it differs from `on` (a rack focus onto the
   * approaching rider while the frame stays on the gate). Structural guide
   * INTENT for a diffusion/render host (#1187): the deterministic camera solve
   * never reads it, and it is not depth-of-field blur (that is diffusion's
   * job). Omit when the framed subject is the focus.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-refusal Exposes `focus` as the portable data boundary for the camera target refusal requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-diagnostics-refusal Types `focus` for the clv focus diagnostics refusal system contract.
   */
  focus?: IAutoMovieActionTarget;

  /**
   * Lens intent in millimetres (full-frame equivalent: 24 wide, 50 normal, 85
   * portrait). Structural guide INTENT only (#1187): the scene camera's `fovY`
   * stays the geometric truth and this never changes the solve. Omit when the
   * lens is not a directorial choice.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-refusal Exposes `focalLength` as the portable data boundary for the camera target refusal requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-diagnostics-refusal Types `focalLength` for the clv focus diagnostics refusal system contract.
   */
  focalLength?: number;
}
