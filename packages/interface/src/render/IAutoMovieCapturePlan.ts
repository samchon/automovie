import type { IAutoMovieCaptureCell } from "./IAutoMovieCaptureCell";
import type { IAutoMoviePlaybackEvent } from "../production/IAutoMoviePlaybackEvent";
import type { IAutoMovieCaptureLayout } from "./IAutoMovieCaptureLayout";
import type { IAutoMovieCapturePlanRequest } from "./IAutoMovieCapturePlanRequest";
import type { IAutoMovieCaptureSubject } from "./IAutoMovieCaptureSubject";
import type { IAutoMovieCaptureTime } from "./IAutoMovieCaptureTime";
import type { IAutoMovieCaptureWindow } from "./IAutoMovieCaptureWindow";

/**
 * A whole capture as data, built by `planCapture` before anything is
 * drawn: every cell in drawing order, the times and windows they came from, and
 * the sheet layout.
 *
 * Every refusal the request and the subject decide has already been made, so a
 * plan only fails to draw where the host's draw function fails, and the record
 * keeps that cell with its cause.
 */
export interface IAutoMovieCapturePlan {
  /** The subject the plan was checked against. */
  subject: IAutoMovieCaptureSubject;

  /** The request the plan was made from. */
  request: IAutoMovieCapturePlanRequest;

  /** Every instant drawn, in time order without repeats. */
  times: IAutoMovieCaptureTime[];

  /** The frames drawn around each event and cut, in the order named. */
  windows: IAutoMovieCaptureWindow[];

  /** The selected occurrence on both the source and output clocks. */
  playedCue?: Readonly<IAutoMoviePlaybackEvent>;

  /**
   * Every still, in drawing order: by selection, then time, then view, then
   * pass.
   */
  cells: IAutoMovieCaptureCell[];

  /** How the stills are laid on sheets. */
  layout: IAutoMovieCaptureLayout;
}
