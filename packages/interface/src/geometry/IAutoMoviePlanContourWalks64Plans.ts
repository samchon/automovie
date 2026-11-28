import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { IAutoMoviePlanContourWalks64Ring } from "./IAutoMoviePlanContourWalks64Ring";

/**
 * Two-phase slit walks. Finish preparation and shared ring refinement before
 * resolving any walk. The closures retain the prepared walks, their point
 * objects and the source-owner callbacks.
 */
export interface IAutoMoviePlanContourWalks64Plans<
  R extends IAutoMoviePlanContourWalks64Ring,
> {
  /**
   * Prepare a walk for two or more caller-admitted ring indices in order.
   * Repeated ordered identities reuse the walk. Insertion callbacks can mutate
   * shared knots before an exception propagates.
   */
  prepare: (rings: R[], selection: number[]) => void;

  /**
   * Resolve a nonempty selection. A singleton borrows its point array. A branch
   * allocates a walk that includes later source knots. Missing preparation and
   * missing source identities throw. The first call closes preparation even
   * when it fails.
   */
  resolve: (rings: R[], selection: number[]) => AutoMovieVector3Tuple[];
}
