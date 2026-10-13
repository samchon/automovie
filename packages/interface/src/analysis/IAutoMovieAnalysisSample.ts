import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One value of one metric at one place, for a field overlay.
 *
 * A sample may only carry a key some metric of the same run actually measured.
 * A heatmap of a metric that produced no value would be a picture of a
 * computation nobody ran, which is the exact confusion this contract exists to
 * make impossible.
 *
 * A run carries at most the engine's `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` (4096)
 * samples; a larger field is refused, never truncated.
 */
export interface IAutoMovieAnalysisSample {
  /** Stable sample identity, unique within the run. */
  id: string;

  /** Metric key this sample is a field of. */
  key: string;

  /** World position in metres; every component finite. */
  position: IAutoMovieVector3;

  /** Finite value at {@link position}, in the metric's unit. */
  value: number;
}
