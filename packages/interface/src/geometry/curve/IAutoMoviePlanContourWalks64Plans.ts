import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMoviePlanContourWalks64Ring } from "./IAutoMoviePlanContourWalks64Ring";

/**
 * Stateful two-phase slit-walk closures. Complete every prepare call and all ring
 * refinement before the first resolve call. Closures retain walks, ring objects,
 * point tuples and source-owner callbacks until the result is released.
 *
 * @evidence contracts/development/design.md#principled-representation Ordered local ring selections define a cyclic millimetre walk; R preserves source ownership shared with insertion and identity callbacks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieContourWalks64 exposes preparation to boundary staging and resolution to contour emission, sharing one cache.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Resolving an unprepared branch or preparing after any resolve throws; no alternative slit is silently generated during emission.
 * @evidence contracts/development/common.md#meaningful-documentation Defines phase ordering, cache retention, shared return storage, selection premises and propagated callback failures.
 */
export interface IAutoMoviePlanContourWalks64Plans<
  R extends IAutoMoviePlanContourWalks64Ring,
> {
  /**
   * Prepare the ordered valid local indices before resolution. Fewer than two indices require no slit; repeated selections reuse the stored walk. Insertion callbacks run synchronously and may mutate shared ring knots; their exceptions propagate without transactional rollback.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States valid ordered selections, repeated-walk reuse, synchronous ring mutation and propagated failures without rollback.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; planAutoMovieContourWalks64's retained prepare/resolve closures own the numerical method under the documented units and input premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; planAutoMovieContourWalks64's retained prepare/resolve closures own executable decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by planAutoMovieContourWalks64's retained prepare/resolve closures.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; planAutoMovieContourWalks64's retained prepare/resolve closures own its evaluation cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; planAutoMovieContourWalks64's retained prepare/resolve closures decide whether calls share coefficients, identities or mutable state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; planAutoMovieContourWalks64's retained prepare/resolve closures own references retained by the supplied callable.
   */
  prepare: (rings: R[], selection: number[]) => void;

  /**
   * Resolve a nonempty valid selection after all preparation. A singleton returns the original points array; a branch returns a fresh array borrowing point tuples and incorporating refined source knots. Missing preparations or lost source identities throw, as do callback failures. Even a failed call closes preparation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States preparation ordering, singleton aliasing versus branch array ownership, source-identity failures and closure of preparation even after failure.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; planAutoMovieContourWalks64's retained prepare/resolve closures own the numerical method under the documented units and input premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; planAutoMovieContourWalks64's retained prepare/resolve closures own executable decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by planAutoMovieContourWalks64's retained prepare/resolve closures.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; planAutoMovieContourWalks64's retained prepare/resolve closures own its evaluation cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; planAutoMovieContourWalks64's retained prepare/resolve closures decide whether calls share coefficients, identities or mutable state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; planAutoMovieContourWalks64's retained prepare/resolve closures own references retained by the supplied callable.
   */
  resolve: (rings: R[], selection: number[]) => AutoMovieVector3Tuple[];
}
