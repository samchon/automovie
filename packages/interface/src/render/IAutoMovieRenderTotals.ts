import type { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * Complete render metric population with a numeric preflight total or explicit
 * absence of measurement.
 */
export type IAutoMovieRenderTotals = {
  [metric in AutoMovieRenderMetric]: number | null;
};
