import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * Complete render metric population with a numeric preflight total or explicit absence of measurement.
 *
 * @evidence contracts/development/design.md#principled-representation A mapped type requires every closed render metric to carry its exact count, conservative upper bound or device-byte estimate, while null accompanies an explicit inventory analysis gap.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One complete metric map serves inventory and budget evaluation without optional missing keys that could silently omit unsupported costs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null is not zero and cannot produce measured within clearance; each number retains its metric-specific measurement interpretation rather than claiming observed GPU statistics.
 * @evidence contracts/development/common.md#meaningful-documentation Defines complete metric coverage, preflight numeric meaning and unmeasured null state.
 */
export type IAutoMovieRenderTotals = {
  [metric in AutoMovieRenderMetric]: number | null;
};
