import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import type { IAutoMovieWorldSurface } from "./IAutoMovieWorldSurface";

/**
 * Data and callback contracts shared by the MaterializeCompiledFormationInventory operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compile every formation of a production into its compact runtime record. Member documentation states the supplied records, units and absence meanings used by materializeCompiledFormationInventory.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The inventory input holds designs rather than expanded members; deterministic id ordering belongs to materializeCompiledFormationInventory and radii retain host-estimate semantics.
 * @evidence contracts/development/design.md#principled-representation formations is keyed by authored id and shares models, metre-valued radius estimates and ordered world surfaces across materialization.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieMaterializeCompiledFormationInventory, used by materializeCompiledFormationInventory. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieMaterializeCompiledFormationInventory {
  /**
   * Compile every formation of a production into its compact runtime record.
   *
   * Records are keyed by formation id and inserted in code-unit order of that id,
   * so the inventory and every artifact that serializes it are the same whatever
   * order the designs were read in. Each formation is compiled against the same
   * model groups, radii and terrain, which is what makes a unit compiled here the unit
   * a shot compiled from the same inputs would hold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Compile every formation of a production into its compact runtime record. Member documentation states the supplied records, units and absence meanings used by materializeCompiledFormationInventory.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The inventory input holds designs rather than expanded members; deterministic id ordering belongs to materializeCompiledFormationInventory and radii retain host-estimate semantics.
   * @evidence contracts/development/design.md#principled-representation formations is keyed by authored id and shares models, metre-valued radius estimates and ordered world surfaces across materialization.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieMaterializeCompiledFormationInventory.IProps, used by materializeCompiledFormationInventory. Its formations, models, projectionRadii, surfaces members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Formation designs keyed by id. */
    formations: ReadonlyMap<string, IAutoMovieFormationDesign>;
    /** Model groups keyed by the id the formation and its tiers name; empty when none are supplied. */
    models?: ReadonlyMap<string, IAutoMovieModel>;
    /** Supplied root-centered radius estimate in metres keyed by model group id. */
    projectionRadii?: ReadonlyMap<string, number>;
    /** World terrain in declared order; empty when the world has none. */
    surfaces?: readonly IAutoMovieWorldSurface[];
  };
}
