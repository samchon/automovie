import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieCameraAction } from "../harness/IAutoMovieCameraAction";

/**
 * One frame span's directorial intent for framing, camera movement and lens settings.
 *
 * A downstream host can read the lens marks independently of the camera path.
 * The scene camera's `fovY` remains the geometric field of view.
 *
 * @evidence contracts/development/design.md#principled-representation `performShot` writes one intent per live-camera `frame` action, copying start, framing, move and focal length and resolving ordinary focus at shot time `0` and a timed pull at its two marked instants; a coverage take writes one intent at `0` with both lens fields `null`, and the shot artifact validator bounds `start` to the shot and `focalLength` above `0`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `framing` and `move` index into `IAutoMovieCameraAction` so the recorded vocabulary is the authored one, and the lens fields are nullable members rather than optional ones so every span states whether the author chose them. The second mark appears only on an authored focus pull.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A focus pull records two world marks for a downstream host to interpret. Ordinary focus retains the historical opening read.
 * @evidence contracts/development/common.md#meaningful-documentation States that the record is guide metadata the solve ignores, the time at which focus is resolved, the seconds and millimetre units, the bounds, and what each `null` means.
 */
export interface IAutoMovieCameraIntent {
  /** Shot-local start in seconds of the frame span, within the shot. */
  start: number;

  /** Shot size the span asks for. */
  framing: IAutoMovieCameraAction["framing"];

  /** How the camera behaves over the span. */
  move: IAutoMovieCameraAction["move"];

  /**
   * World focus point in metres at the pull's first mark if present, otherwise
   * at shot time `0`. A `null` here means the action named no lens subject.
   */
  focus: IAutoMovieVector3 | null;

  /** Second focus mark and the timing of both marks, when authored. */
  focusPull?: {
    /** Shot-local seconds of the first mark, at or after the frame start. */
    start: number;

    /** Shot-local seconds of the second mark, strictly after the first. */
    end: number;

    /** World focus point in metres at the second mark. */
    to: IAutoMovieVector3;
  };

  /**
   * Positive lens intent in millimetres, full-frame equivalent, or `null` when
   * the action named none.
   */
  focalLength: number | null;
}
