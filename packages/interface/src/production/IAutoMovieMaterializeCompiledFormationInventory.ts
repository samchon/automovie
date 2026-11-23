import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import type { IAutoMovieWorldSurface } from "./IAutoMovieWorldSurface";

/**
 * Data and callback contracts shared by the
 * MaterializeCompiledFormationInventory operations.
 */
export namespace IAutoMovieMaterializeCompiledFormationInventory {
  /**
   * Compile every formation of a production into its compact runtime record.
   *
   * Records are keyed by formation id and inserted in code-unit order of that
   * id, so the inventory and every artifact that serializes it are the same
   * whatever order the designs were read in. Each formation is compiled against
   * the same model groups, radii and terrain, which is what makes a unit
   * compiled here the unit a shot compiled from the same inputs would hold.
   */
  export type IProps = {
    /** Formation designs keyed by id. */
    formations: ReadonlyMap<string, IAutoMovieFormationDesign>;
    /**
     * Model groups keyed by the id the formation and its tiers name; empty when
     * none are supplied.
     */
    models?: ReadonlyMap<string, IAutoMovieModel>;
    /** Supplied root-centered radius estimate in metres keyed by model group id. */
    projectionRadii?: ReadonlyMap<string, number>;
    /** World terrain in declared order; empty when the world has none. */
    surfaces?: readonly IAutoMovieWorldSurface[];
  };
}
