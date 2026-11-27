import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One value of one metric at one place, for a field overlay.
 *
 * A sample may only carry a key that some metric of the same run measured, so
 * no heatmap can be drawn for a metric that produced no value.
 *
 * A run carries at most the engine's `AutoMovieEngineAnalysisMaxSamples` (4096)
 * samples; a larger field is refused, never truncated.
 */
export interface IAutoMovieAnalysisSample {
  /** Non-blank stable sample identity, unique within the run. */
  id: string;

  /** Metric key this sample is a field of. */
  key: string;

  /** World position in metres; every component finite. */
  position: IAutoMovieVector3;

  /** Finite value at {@link position}, in the metric's unit. */
  value: number;
}
