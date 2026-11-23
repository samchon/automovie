import type { IAutoMovieRenderReport } from "./IAutoMovieRenderReport";
import type { IAutoMovieRenderTarget } from "./IAutoMovieRenderTarget";
import type { IAutoMovieRenderTargetDrift } from "./IAutoMovieRenderTargetDrift";

/** Data and callback contracts shared by the CompareRenderTarget operations. */
export namespace IAutoMovieCompareRenderTarget {
  /**
   * Decide whether a report is still evidence about the target in front of you.
   *
   * A budget verdict is a claim about a specific renderer drawing specific
   * bytes at a specific size. Change any of that and the verdict is not
   * conservative, it is wrong in an unknown direction: a smaller shadow map
   * makes a failing report pass and a larger one makes a passing report fail,
   * and neither re-measured anything. So a mismatch is `stale`, never `pass`,
   * and every differing field is named so the drift is actionable instead of
   * mysterious.
   */
  export type IProps = {
    /** The report being re-used as evidence. */
    report: IAutoMovieRenderReport;
    /** The target a consumer is about to render with. */
    current: IAutoMovieRenderTarget;
  };

  /**
   * Decide whether a report is still evidence about the target in front of you.
   *
   * A budget verdict is a claim about a specific renderer drawing specific
   * bytes at a specific size. Change any of that and the verdict is not
   * conservative, it is wrong in an unknown direction: a smaller shadow map
   * makes a failing report pass and a larger one makes a passing report fail,
   * and neither re-measured anything. So a mismatch is `stale`, never `pass`,
   * and every differing field is named so the drift is actionable instead of
   * mysterious.
   */
  export type IResult = {
    /** Whether the report still describes the current target. */
    fresh: boolean;
    /** Every differing field, ascending; empty when fresh. */
    drift: IAutoMovieRenderTargetDrift[];
  };
}
