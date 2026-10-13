import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One value of one metric at one place, for a field overlay.
 *
 * A sample may only carry a key some metric of the same run actually measured.
 * A heatmap of a metric that produced no value would be a picture of a
 * computation nobody ran, which is the exact confusion this contract exists to
 * make impossible.
 */
export interface IAutoMovieAnalysisSample {
  /** Stable sample identity within the run. */
  id: string;

  /** Metric key this sample is a field of. */
  key: string;

  /** World position in metres. */
  position: IAutoMovieVector3;

  /** Finite value at {@link position}, in the metric's unit. */
  value: number;
}
