import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieCameraAction } from "../harness/IAutoMovieCameraAction";

/**
 * One frame span's directorial camera intent: what the take frames and how,
 * plus the two lens intents the move grammar does not carry, the focus point
 * and the focal length.
 *
 * It is guide metadata only. The camera solve never reads it, the scene
 * camera's `fovY` stays the geometric truth, and depth-of-field blur is left
 * to the diffusion pass. `performShot` resolves `focus` once, at shot time
 * `0` rather than at the span's `start`, so a subject that moves records where
 * it stood at the opening.
 *
 * @evidence contracts/common.md#principled-implementation `performShot` writes one intent per live-camera `frame` action, copying start, framing, move and focal length and resolving a focus target to a world point at shot time `0`; a coverage take writes one intent at `0` with both lens fields `null`, and the shot artifact validator bounds `start` to the shot and `focalLength` above `0`.
 * @evidence contracts/common.md#clear-and-simple-design `framing` and `move` index into `IAutoMovieCameraAction` so the recorded vocabulary is the authored one, and the lens fields are nullable members rather than optional ones so every span states whether the author chose them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The focus is resolved at the opening instead of per span and is documented so, rather than presented as a tracked point, and no lens value is invented when the action named none.
 * @evidence contracts/common.md#meaningful-documentation States that the record is guide metadata the solve ignores, the time at which focus is resolved, the seconds and millimetre units, the bounds, and what each `null` means.
 * @author Samchon
 */
export interface IAutoMovieCameraIntent {
  /** Shot-local start in seconds of the frame span, within the shot. */
  start: number;

  /** Shot size the span asks for. */
  framing: IAutoMovieCameraAction["framing"];

  /** How the camera behaves over the span. */
  move: IAutoMovieCameraAction["move"];

  /**
   * World focus point resolved at shot time `0`, or `null` when the action
   * named none.
   */
  focus: IAutoMovieVector3 | null;

  /**
   * Positive lens intent in millimetres, full-frame equivalent, or `null` when
   * the action named none.
   */
  focalLength: number | null;
}
