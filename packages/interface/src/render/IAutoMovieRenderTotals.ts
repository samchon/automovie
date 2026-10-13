import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/** Every metric's measured value, or `null` when it was not measured. */
export type IAutoMovieRenderTotals = {
  [metric in AutoMovieRenderMetric]: number | null;
};
