import type { IAutoMoviePlanarCurveSource } from "../index";

/**
 * Borrowed planar evaluator augmented with interior source-knot observation
 * locations.
 *
 * Supply observation knots in the original parameter. Use the inherited breaks
 * to identify nonsmooth boundaries that must form separate charts.
 */
export interface IAutoMoviePiecewisePlanarCurveSource extends IAutoMoviePlanarCurveSource {
  /**
   * Source piece boundaries strictly inside the domain, used for observation
   * coverage rather than compulsory fitted splits.
   */
  knots: readonly number[];
}
