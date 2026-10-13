import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * Complete render metric population with a numeric preflight total or explicit absence of measurement.
 *
 * @evidence contracts/common.md#principled-implementation A mapped type requires every closed render metric to carry its exact count, conservative upper bound or device-byte estimate, while null accompanies an explicit inventory analysis gap.
 * @evidence contracts/common.md#clear-and-simple-design One complete metric map serves inventory and budget evaluation without optional missing keys that could silently omit unsupported costs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null is not zero and cannot produce measured within clearance; each number retains its metric-specific measurement interpretation rather than claiming observed GPU statistics.
 * @evidence contracts/common.md#meaningful-documentation Defines complete metric coverage, preflight numeric meaning and unmeasured null state.
 * @author Samchon
 */
export type IAutoMovieRenderTotals = {
  [metric in AutoMovieRenderMetric]: number | null;
};
