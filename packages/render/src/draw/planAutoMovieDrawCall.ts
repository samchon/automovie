import type { IAutoMovieCaptureCell } from "../capture/IAutoMovieCaptureCell.js";
import type { IAutoMovieCapturePlan } from "../capture/IAutoMovieCapturePlan.js";
import type { IAutoMovieCaptureTime } from "../capture/IAutoMovieCaptureTime.js";
import { scaleAutoMovieCaptureLabels } from "../capture/scaleAutoMovieCaptureLabels.js";
import type { IAutoMovieDrawCall } from "./IAutoMovieDrawCall.js";

/**
 * Turn one planned capture cell into the call a draw page answers: the cell's second, view and inspection request as given, the subject's raster, every planned second as the framing span, and the label scale the capture run stamps at.
 *
 * Every second of the plan frames a fitted view, so a view keeps one camera across the whole capture and a subject's travel reads as travel; the pass is the request's `shade`, which the planner already set to the cell's pass.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is taken from the cell, the subject and the plan, and why the plan's seconds are the framing span.
 * @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/capture.md`: a view that fits itself to its subject resolves to another camera when the subject changes, so one capture frames on all its seconds; the label scale is `scaleAutoMovieCaptureLabels`, the rule the capture run stamps by.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Values pass as planned; nothing is rounded or defaulted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the plan's seconds, which every call carries.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure mapping of one cell.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh call and keeps nothing.
 */
export function planAutoMovieDrawCall(
  cell: IAutoMovieCaptureCell,
  plan: Pick<IAutoMovieCapturePlan, "subject" | "times" | "layout">,
): IAutoMovieDrawCall {
  return {
    seconds: cell.time.seconds,
    view: cell.view,
    request: cell.request,
    width: plan.subject.width,
    height: plan.subject.height,
    frame: plan.times.map((time: IAutoMovieCaptureTime): number => time.seconds),
    scale: scaleAutoMovieCaptureLabels(plan.subject, plan.layout),
  };
}
