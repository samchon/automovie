import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress.js";
import type { createHumanViewerSpans } from "./createHumanViewerSpans.js";

/**
 * What the page's numerical transport reports to: stage transitions and the
 * capture's stage timings.
 *
 * These ports contribute actual numerical completion and capture timing to page-owned observation. They carry no planned-work denominator or completion estimate.
 *
 * @evidence contracts/common.md#clear-and-simple-design The page keeps telemetry; the transport only reports into it.
 * @evidence contracts/common.md#meaningful-documentation Names both report targets.
 *
 * @evidence contracts/common.md#principled-implementation Numerical completion records report existing work phases and capture timings to their page-owned telemetry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress is supplied by the numerical owner rather than estimated from elapsed wall time.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerNumericalPortProps {
  /**
   * Reports a work-stage transition.
   *
   * @evidence contracts/common.md#principled-implementation Actual numerical completion advances the page's work phase with the original optional progress envelope.
   * @evidence contracts/common.md#clear-and-simple-design The transport reports to telemetry rather than owning its state transitions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reported completion is the worker's event, not an estimated percentage.
   * @evidence contracts/common.md#meaningful-documentation Phase and optional completed-stage readings remain distinct inputs.
   */
  work: (
    phase: HumanViewerWork["phase"],
    completed?: IHumanViewerNumericalProgress,
  ) => void;

  /** Stage timings of the current capture. */
  spans: ReturnType<typeof createHumanViewerSpans>;
}
