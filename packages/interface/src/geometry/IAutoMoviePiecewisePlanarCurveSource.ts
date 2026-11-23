import type { IAutoMoviePlanarCurveSource } from "../index";

/**
 * Source knots are observation locations, not mandatory output boundaries. The
 * inherited breaks alone identify actual corners that cannot be crossed.
 */
export interface IAutoMoviePiecewisePlanarCurveSource extends IAutoMoviePlanarCurveSource {
  /**
   * Every source piece boundary, strictly inside domain, for observation
   * coverage.
   */
  knots: readonly number[];
}
