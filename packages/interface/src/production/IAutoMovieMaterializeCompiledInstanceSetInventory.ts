import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Data and callback contracts shared by the
 * MaterializeCompiledInstanceSetInventory operations.
 */
export namespace IAutoMovieMaterializeCompiledInstanceSetInventory {
  /**
   * Compile every instance set a world declares into its compact runtime
   * record.
   *
   * Records are keyed by set id and inserted in code-unit order of that id, so
   * the inventory is the same whatever order the world lists its sets in. A
   * world that declares no instance sets compiles to an empty inventory.
   */
  export type IProps = {
    /** World whose instance sets and routes are compiled. */
    world: Pick<IAutoMovieWorldDesign, "instanceSets" | "routes">;
    /**
     * Model groups keyed by the id the sets, their prototypes and their tiers
     * name; empty when none are supplied.
     */
    models?: ReadonlyMap<string, IAutoMovieModel>;
    /** Supplied root-centered radius estimate in metres keyed by model group id. */
    projectionRadii?: ReadonlyMap<string, number>;
  };
}
