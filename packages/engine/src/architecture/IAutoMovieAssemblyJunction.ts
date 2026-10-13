import { IAutoMovieAssemblyBreak } from "./IAutoMovieAssemblyBreak";
import { IAutoMovieAssemblyContinuity } from "./IAutoMovieAssemblyContinuity";

/**
 * What survives a junction between two build-ups and what stops there.
 *
 * Produced by `matchAutoMovieAssemblyJunction`. Every role either build-up
 * declares appears exactly once: in `continuous` when both declare it, in
 * `broken` when only one does. Order follows each role's first layer in its
 * build-up; nothing is sorted by name.
 *
 * @evidence contracts/common.md#principled-implementation Partitions the union of the two role maps: a role in both goes to `continuous` and a role in one goes to `broken`, so the two lists together name each declared role once.
 * @evidence contracts/common.md#clear-and-simple-design Two arrays rather than one tagged list, because callers act on continuities (alignment) and breaks (a stopped layer) differently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordering comes from `Map` insertion order of each role's first layer rather than from a role ranking, so no role is promoted or hidden.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the partition rule, and the exact ordering of both arrays.
 * @evidenceExclude contracts/performance.md#cost-and-resources A container of two arrays the matcher fills in O(left layers + right layers); no junction is memoized and it references none of the resolved layers.
 * @author Samchon
 */
export interface IAutoMovieAssemblyJunction {
  /** Roles both sides carry, in the left build-up's declaration order. */
  continuous: IAutoMovieAssemblyContinuity[];

  /** Roles only one side carries, left-hand ones first. */
  broken: IAutoMovieAssemblyBreak[];
}
