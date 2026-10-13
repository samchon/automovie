import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress.js";
import type { createHumanViewerSpans } from "./createHumanViewerSpans.js";

/**
 * What the page's numerical transport reports to: stage transitions and the
 * capture's stage timings.
 *
 * These ports contribute actual numerical completion and capture timing to page-owned observation. They carry no planned-work denominator or completion estimate.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerNumericalPortProps {
  /** Reports a work-stage transition. */
  work: (
    phase: HumanViewerWork["phase"],
    completed?: IHumanViewerNumericalProgress,
  ) => void;

  /** Stage timings of the current capture. */
  spans: ReturnType<typeof createHumanViewerSpans>;
}
