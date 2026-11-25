import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Sampled saved ring viewed by slab correspondence. The planner reads these
 * borrowed points and signed winding without changing their order.
 */
export interface IAutoMoviePlanContourSlabs64Ring {
  /**
   * Cyclic samples in the common model millimetre frame; admitted usable rings
   * support source-curve separation scoring.
   */
  points: AutoMovieVector3Tuple[];

  /**
   * Declared material-boundary winding, compared for exact equality when
   * selecting continuation candidates.
   */
  winding: number;

  /**
   * Sampling or representation refusal; presence excludes this ring from
   * ordinary geometric matching while retaining its saved ordinal.
   */
  unsupported?: string;
}
