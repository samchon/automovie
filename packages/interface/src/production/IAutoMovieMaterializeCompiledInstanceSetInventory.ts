import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Data and callback contracts shared by the MaterializeCompiledInstanceSetInventory operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compile every instance set a world declares into its compact runtime record. Member documentation states the supplied records, units and absence meanings used by materializeCompiledInstanceSetInventory.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The world retains ownership of authored sets; missing geometry estimates follow the same base/0.5m policy as single-set materialization without asserting enclosure.
 * @evidence contracts/development/design.md#principled-representation world supplies all instance-set designs and routes, with shared model and metre-radius context for their compact materialization.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieMaterializeCompiledInstanceSetInventory, used by materializeCompiledInstanceSetInventory. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieMaterializeCompiledInstanceSetInventory {
  /**
   * Compile every instance set a world declares into its compact runtime record.
   *
   * Records are keyed by set id and inserted in code-unit order of that id, so
   * the inventory is the same whatever order the world lists its sets in. A
   * world that declares no instance sets compiles to an empty inventory.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Compile every instance set a world declares into its compact runtime record. Member documentation states the supplied records, units and absence meanings used by materializeCompiledInstanceSetInventory.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The world retains ownership of authored sets; missing geometry estimates follow the same base/0.5m policy as single-set materialization without asserting enclosure.
   * @evidence contracts/development/design.md#principled-representation world supplies all instance-set designs and routes, with shared model and metre-radius context for their compact materialization.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieMaterializeCompiledInstanceSetInventory.IProps, used by materializeCompiledInstanceSetInventory. Its world, models, projectionRadii members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** World whose instance sets and routes are compiled. */
    world: Pick<IAutoMovieWorldDesign, "instanceSets" | "routes">;
    /** Model groups keyed by the id the sets, their prototypes and their tiers name; empty when none are supplied. */
    models?: ReadonlyMap<string, IAutoMovieModel>;
    /** Supplied root-centered radius estimate in metres keyed by model group id. */
    projectionRadii?: ReadonlyMap<string, number>;
  };
}
