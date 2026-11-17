import type { IAutoMovieInspectionDrawable } from "../inspection/IAutoMovieInspectionDrawable.js";
import type { IAutoMovieCaptureInstant } from "./IAutoMovieCaptureInstant.js";

/**
 * What a host learns about a subject from the page before a capture is planned: its clock, its raster, and what can be drawn of it.
 *
 * A subject is a scene, a set of identity paths and the marks its owner supplies; nothing here names what kind of thing it is. `planAutoMovieCapture` checks a request against it, so a view, a time, a mark kind or a sweep the subject cannot give is refused before anything is drawn.
 *
 * @evidence contracts/development/design.md#principled-representation The subject's clock (seconds and frames per second), its raster in pixels, its view names, its drawn objects with world boxes in metres and its mark kinds are the facts a plan is checked against; nothing about how it is drawn is held.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read by the planner: the clock by the times, the raster by the layout, the views and mark kinds by the refusals, the drawables by the sweep, the named instants by the captions. Boxes use the interface's own vector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a subject kind, a film or a figure. That durations, rates and sizes are positive and boxes finite is checked by the planner at runtime.
 * @evidence contracts/development/common.md#meaningful-documentation States who fills it and when, who reads it, and each member's unit and meaning.
 */
export interface IAutoMovieCaptureSubject {
  /**
   * Name of the subject, as the request's `subject` names it and the record keeps it.
   */
  name: string;

  /**
   * Running time in seconds; the last frame is the last whole frame before it.
   */
  durationSeconds: number;

  /**
   * Frames per second of the subject's own grid, which event and cut windows count in.
   */
  fps: number;

  /**
   * Width in pixels of every still drawn of the subject.
   */
  width: number;

  /**
   * Height in pixels of every still drawn of the subject.
   */
  height: number;

  /**
   * Names a named view may take: the subject's own views and the named viewpoints the host fits, such as `front`. `film` and a camera by coordinates need no name.
   */
  views: string[];

  /**
   * Every drawn object with its identity path and its world-space box in metres, which a sweep groups into units and neighbours.
   */
  drawables: IAutoMovieInspectionDrawable[];

  /**
   * Every mark kind the subject's owners supply under the request, such as `curve/section`; a `marks` pattern must match one.
   */
  marks: string[];

  /**
   * Instants the subject names, such as a motion case's beats; a cell drawn at a second written the same to the millisecond carries the instant's label in its caption and its record row. Absent names none.
   */
  instants?: IAutoMovieCaptureInstant[];
}
