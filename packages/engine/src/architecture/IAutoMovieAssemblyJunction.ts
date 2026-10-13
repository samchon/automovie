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
 * @author Samchon
 */
export interface IAutoMovieAssemblyJunction {
  /** Roles both sides carry, in the left build-up's declaration order. */
  continuous: IAutoMovieAssemblyContinuity[];

  /** Roles only one side carries, left-hand ones first. */
  broken: IAutoMovieAssemblyBreak[];
}
