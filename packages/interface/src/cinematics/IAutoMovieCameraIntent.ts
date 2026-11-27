import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieCameraFocusPull } from "./IAutoMovieCameraFocusPull";
import type { AutoMovieCameraFraming } from "../harness/AutoMovieCameraFraming";
import type { IAutoMovieCameraAction } from "../harness/IAutoMovieCameraAction";

/**
 * One frame span's directorial intent for framing, camera movement and lens
 * settings.
 *
 * A downstream host can read the lens marks independently of the camera path.
 * The scene camera's `fovY` remains the geometric field of view.
 */
export interface IAutoMovieCameraIntent {
  /** Shot-local start in seconds of the frame span, within the shot. */
  start: number;

  /** Shot size the span asks for. */
  framing: AutoMovieCameraFraming;

  /** How the camera behaves over the span. */
  move: IAutoMovieCameraAction["move"];

  /**
   * World focus point in metres at the pull's first mark if present, otherwise
   * at shot time `0`. A `null` here means the action named no lens subject.
   */
  focus: IAutoMovieVector3 | null;

  /** Second focus mark and the timing of both marks, when authored. */
  focusPull?: IAutoMovieCameraFocusPull;

  /**
   * Positive lens intent in millimetres, full-frame equivalent, or `null` when
   * the action named none.
   */
  focalLength: number | null;

  /**
   * The lens stop, finite and `> 0`, present exactly when the action authored
   * `fNumber`. `resolveAutoMovieLensAt` reads it with `focus` and `focusPull`.
   */
  fNumber?: number;
}
