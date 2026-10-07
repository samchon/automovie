import type { HumanViewerWork } from "./HumanViewerWork";
import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress";
import type { createHumanViewerSpans } from "./createHumanViewerSpans";

/**
 * What the page's numerical transport reports to: stage transitions and the
 * capture's stage timings.
 *
 * @evidence contracts/common.md#clear-and-simple-design The page keeps telemetry; the transport only reports into it.
 * @evidence contracts/common.md#meaningful-documentation Names both report targets.
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
