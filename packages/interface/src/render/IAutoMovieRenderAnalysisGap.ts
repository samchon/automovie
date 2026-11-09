import { AutoMovieRenderAnalysisStatus } from "./AutoMovieRenderAnalysisStatus";
import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * One render-cost analysis gap with its owning metric, cause and recovery requirement.
 *
 * @evidence contracts/development/design.md#principled-representation Inventory marks unavailable analysis as unsupported or missing admitted input as not-run, retaining the exact declaration and data needed before a numeric measurement can exist.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Metric, status, reason and remedy give the evaluator enough information for an incomplete finding without inventing a number.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A gap cannot be replaced by zero or an inferred budget success; the remedy describes required capability or input rather than fitting a constant to the expected report.
 * @evidence contracts/development/common.md#meaningful-documentation Defines unmeasured metric, missing-capability versus unexecuted-analysis status, exact cause and corrective requirement.
 */
export interface IAutoMovieRenderAnalysisGap {
  /** Metric left without a measurement. */
  metric: AutoMovieRenderMetric;

  /** Whether the analysis is missing entirely or merely did not execute. */
  status: AutoMovieRenderAnalysisStatus;

  /** Exactly what is absent, naming the declaration that needed it. */
  reason: string;

  /** Exactly what would make the analysis produce a number. */
  remedy: string;
}
