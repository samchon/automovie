import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One frame span's directorial camera intent (#1187): what the take frames and
 * how, plus the two lens intents the fixed move grammar could not carry: the
 * focus subject (resolved to a world point) and the focal length. INTENT only:
 * `fovY` on the scene camera stays the geometric truth, and depth-of-field blur
 * is deliberately out of scope (diffusion's job).
 *
 * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-time-sampling Exposes `IAutoMovieCameraIntent` as the portable data boundary for the camera grammar time sampling requirement.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Types `IAutoMovieCameraIntent` for the clv grammar sampling findings system contract.
 */
export interface IAutoMovieCameraIntent {
  /**
   * Shot-local start (seconds) of the frame span this intent covers.
   *
   * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-time-sampling Exposes `start` as the portable data boundary for the camera grammar time sampling requirement.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Types `start` for the clv grammar sampling findings system contract.
   */
  start: number;

  /**
   * How tight the framing is.
   *
   * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-time-sampling Exposes `framing` as the portable data boundary for the camera grammar time sampling requirement.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Types `framing` for the clv grammar sampling findings system contract.
   */
  framing: "wide" | "full" | "medium" | "close";

  /**
   * How the camera behaves over the span.
   *
   * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-time-sampling Exposes `move` as the portable data boundary for the camera grammar time sampling requirement.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Types `move` for the clv grammar sampling findings system contract.
   */
  move: "static" | "follow" | "orbit" | "push-in" | "truck" | "whip";

  /**
   * Resolved world focus point, or `null` when the action named none.
   *
   * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-time-sampling Exposes `focus` as the portable data boundary for the camera grammar time sampling requirement.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Types `focus` for the clv grammar sampling findings system contract.
   */
  focus: IAutoMovieVector3 | null;

  /**
   * Lens intent in millimetres, or `null` when the action named none.
   *
   * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-time-sampling Exposes `focalLength` as the portable data boundary for the camera grammar time sampling requirement.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Types `focalLength` for the clv grammar sampling findings system contract.
   */
  focalLength: number | null;
}
