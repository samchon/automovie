import { AutoMovieRenderAnalysisStatus } from "./AutoMovieRenderAnalysisStatus";
import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/** One analysis that produced no number, and the exact reason. */
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
