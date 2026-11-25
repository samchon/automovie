import type { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import type { IAutoMovieCompiledInstanceSet } from "./IAutoMovieCompiledInstanceSet";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/** Data and callback contracts shared by the CreateSourceOracle operations. */
export namespace IAutoMovieCreateSourceOracle {
  /**
   * Build the deterministic helpers a shot source reads through its build
   * context.
   *
   * A shot source asks where one member of a formation or instance set stands
   * while the builder is still compiling the shot, so the answer has to be the
   * one the compiled runtime holds. Both slot helpers regenerate from the
   * compiled records the source's context carries, never from the designs
   * beside them: a formation member stands on the terrain snapshot its unit was
   * compiled against, and an instance member selects from the compiled
   * prototype table, which already counts the default once. Distance is
   * Euclidean in metres, and ground height is the first world surface under the
   * point or zero over none.
   *
   * An id with no compiled record refuses with a `RangeError` naming it,
   * including an id that only an inherited object property would otherwise
   * answer.
   *
   * The oracle keeps references to the three props, not copies, so it answers
   * from whatever those records hold when each method is called. Slot indices
   * are passed through to the slot regenerators, which own their range checks.
   */
  export type IProps = {
    /** World whose surfaces answer ground height. */
    world: Pick<IAutoMovieWorldDesign, "surfaces">;

    /** Compiled formation runtimes keyed by formation id. */
    formationRuntime: Readonly<Record<string, IAutoMovieCompiledFormation>>;

    /** Compiled instance-set runtimes keyed by set id. */
    instanceSetRuntime: Readonly<Record<string, IAutoMovieCompiledInstanceSet>>;
  };
}
