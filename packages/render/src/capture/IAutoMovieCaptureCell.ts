import type { IAutoMovieInspectionRequest } from "../scene/inspection/IAutoMovieInspectionRequest.js";
import type { IAutoMovieCaptureSelection } from "./IAutoMovieCaptureSelection.js";
import type { IAutoMovieCaptureTime } from "./IAutoMovieCaptureTime.js";

/**
 * One still of a capture, as data planned before anything is drawn: fixed by its selection, its time, its view and its pass, which is how `.agents/skills/visual-debugging/capture.md` defines a cell.
 *
 * A host's draw function receives it and draws `request` through `view` at `time.seconds`; the capture names, captions, records and compares it.
 *
 * @evidence contracts/development/design.md#principled-representation The four values that fix a still, plus the complete inspection request they resolve to, so the draw function needs no other input and a later round pairs cells by the same values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The view stays the request's view text, read by the inspection core's view grammar; the request is the inspection core's own type. `index`, `name` and `caption` are read by the sheet and the record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `request.shade` equals `pass` and `request.parts` equals `selection.parts`, kept equal by the planner; the cell names no subject kind.
 * @evidence contracts/development/common.md#meaningful-documentation States what fixes the cell, who reads it and how its members relate.
 */
export interface IAutoMovieCaptureCell {
  /** Position in the plan, from zero, which is the order cells are drawn and laid on sheets. */
  index: number;

  /** File stem of the still, unique in the plan and stable for the same fixing values: the time, the view, the pass and a swept selection. */
  name: string;

  /** Which objects the still draws. */
  selection: IAutoMovieCaptureSelection;

  /** The instant drawn. */
  time: IAutoMovieCaptureTime;

  /** The view text the still is drawn through. */
  view: string;

  /** The shade the still is drawn in. */
  pass: IAutoMovieInspectionRequest.Shade;

  /** The inspection request the still is drawn with, the plan's own with this cell's pass and selection. */
  request: IAutoMovieInspectionRequest;

  /** Caption stamped on the still's sheet cell: the frame and second, then whichever of view, pass and selection vary in the plan. */
  caption: string;
}
