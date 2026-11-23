import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMoviePlanContourWalks64Ring } from "./IAutoMoviePlanContourWalks64Ring";

/**
 * Stateful two-phase slit-walk closures. Complete every prepare call and all
 * ring refinement before the first resolve call. Closures retain walks, ring
 * objects, point tuples and source-owner callbacks until the result is
 * released.
 */
export interface IAutoMoviePlanContourWalks64Plans<
  R extends IAutoMoviePlanContourWalks64Ring,
> {
  /**
   * Prepare the ordered valid local indices before resolution. Fewer than two
   * indices require no slit; repeated selections reuse the stored walk.
   * Insertion callbacks run synchronously and may mutate shared ring knots;
   * their exceptions propagate without transactional rollback.
   */
  prepare: (rings: R[], selection: number[]) => void;

  /**
   * Resolve a nonempty valid selection after all preparation. A singleton
   * returns the original points array; a branch returns a fresh array borrowing
   * point tuples and incorporating refined source knots. Missing preparations
   * or lost source identities throw, as do callback failures. Even a failed
   * call closes preparation.
   */
  resolve: (rings: R[], selection: number[]) => AutoMovieVector3Tuple[];
}
