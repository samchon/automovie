import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One value of one metric at one place, for a field overlay.
 *
 * A sample may only carry a key that some metric of the same run measured, so
 * no heatmap can be drawn for a metric that produced no value.
 *
 * A run carries at most the engine's `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` (4096)
 * samples; a larger field is refused, never truncated.
 *
 * @evidence contracts/common.md#principled-implementation A point sample keyed to a metric; `validateAutoMovieAnalysisRun` collects the keys of metrics with a value and refuses a sample naming any other key, a repeated id, a non-finite coordinate or value, and a sample count past the bound.
 * @evidence contracts/common.md#clear-and-simple-design Position and value only, with the unit inherited from the named metric, so the unit is stated once per field instead of once per sample.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An oversized field is refused rather than thinned, so the overlay never shows a coarser study than the one that ran.
 * @evidence contracts/common.md#meaningful-documentation States the measured-key rule, the sample bound and its refusal behavior, the id scope, the position unit, and which unit the value is in.
 * @author Samchon
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
