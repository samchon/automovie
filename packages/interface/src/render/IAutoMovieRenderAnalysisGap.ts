import type { AutoMovieRenderAnalysisStatus } from "./AutoMovieRenderAnalysisStatus";
import type { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * One render-cost analysis gap with its owning metric, cause and recovery
 * requirement.
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
