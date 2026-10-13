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
 *
 * @evidence contracts/common.md#principled-implementation A point sample of a measured scalar field; validation builds the set of keys whose metric produced a value and refuses a sample naming any other key, a repeated id, or a non-finite coordinate or value.
 * @evidence contracts/common.md#clear-and-simple-design Samples are flat records keyed by metric rather than nested inside each metric, so an overlay picks one field by key and the run digest lists them in one pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The count bound refuses an oversized grid instead of thinning it, and the viewer overlay throws for a metric without a value rather than drawing an empty heatmap.
 * @evidence contracts/common.md#meaningful-documentation States the measured-key rule, the per-run count bound and its refusal, the world frame and metre unit of the position, and that the value shares its metric's unit.
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
