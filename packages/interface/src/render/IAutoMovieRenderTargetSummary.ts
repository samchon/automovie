import type { IAutoMovieRenderReport } from "./IAutoMovieRenderReport";
import type { IAutoMovieRenderTarget } from "./IAutoMovieRenderTarget";

/**
 * Borrowed report/current-target pair for a diagnostic freshness summary.
 *
 * @evidence contracts/development/design.md#principled-representation Preserve both recorded and current targets so the shared comparator can describe exact drift rather than infer freshness from text.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The formatter accepts existing report/target contracts and returns only a string, retaining neither input.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Diagnostic formatting does not repair a stale report or replace target validation.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify which target is historical and which supplies the current comparison facts.
 */
export namespace IAutoMovieRenderTargetSummary {
  /**
   * Read the reported and current digests, for a one-line staleness log.
   */
  export type IProps = {
    /** Existing analysis report carrying the target and digest originally assessed. */
    report: IAutoMovieRenderReport;
    /** Current target facts/digest compared against the report; not mutated or retained. */
    current: IAutoMovieRenderTarget;
  };
}
