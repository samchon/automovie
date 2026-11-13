import type { IAutoMovieCaptureCell } from "./IAutoMovieCaptureCell.js";
import type { IAutoMovieCaptureLayout } from "./IAutoMovieCaptureLayout.js";
import type { IAutoMovieCapturePlanRequest } from "./IAutoMovieCapturePlanRequest.js";
import type { IAutoMovieCaptureSubject } from "./IAutoMovieCaptureSubject.js";
import type { IAutoMovieCaptureTime } from "./IAutoMovieCaptureTime.js";
import type { IAutoMovieCaptureWindow } from "./IAutoMovieCaptureWindow.js";

/**
 * A whole capture as data, built by `planAutoMovieCapture` before anything is drawn: every cell in drawing order, the times and windows they came from, and the sheet layout.
 *
 * Every refusal the request and the subject decide has already been made, so a plan only fails to draw where the host's draw function fails, and the record keeps that cell with its cause.
 *
 * @evidence contracts/development/design.md#principled-representation The subject and request it was planned from, the instants, the windows around events and cuts, the cells and the layout, so a run and its record need nothing else and a reader sees why each cell exists.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read by the run or the record; the request is the grammar's own type and the subject the host's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Cells are a flat list in drawing order, not nested by view or pass, so a sheet, a record row and a comparison pair all index the same list.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, when refusals happen and what each member holds.
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

  /** Every still, in drawing order: by selection, then time, then view, then pass. */
  cells: IAutoMovieCaptureCell[];

  /** How the stills are laid on sheets. */
  layout: IAutoMovieCaptureLayout;
}
