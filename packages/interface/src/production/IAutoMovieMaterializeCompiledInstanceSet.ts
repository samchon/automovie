import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieInstanceSetDesign } from "./IAutoMovieInstanceSetDesign";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Data and callback contracts shared by the MaterializeCompiledInstanceSet
 * operations.
 */
export namespace IAutoMovieMaterializeCompiledInstanceSet {
  /**
   * Compile one world instance set into its compact runtime without expanding
   * it.
   *
   * The record keeps the placement and variation laws, the route snapshot a
   * route layout follows, one bounds and centroid per chunk of
   * {@link AutoMovieEngineInstanceChunkSize} slots, the representation tiers and
   * measured or fallback radius of the base model group and every declared
   * prototype, and a digest of every other field. A declared prototype table is
   * compiled with the base group's default first, which is the choice list
   * every member is regenerated against afterwards.
   *
   * Bounds are measured by regenerating each slot through {@link instanceSlot},
   * so a member whose seeded variation is non-finite, or whose route is missing
   * or has no length, refuses compilation instead of producing a set no
   * consumer can regenerate. Member radii are supplied host estimates that this
   * kernel does not verify against geometry; missing estimates use the base
   * then 0.5m. The digest is SHA-256 over canonical JSON v2 computed without a
   * Node built-in, equal to the Node builder's digest of the same canonical
   * bytes.
   */
  export type IProps = {
    /** Instance set design to compile. */
    instanceSet: IAutoMovieInstanceSetDesign;
    /** World routes a route layout resolves its route from. */
    world: Pick<IAutoMovieWorldDesign, "routes">;
    /**
     * Model groups keyed by the id the set, its prototypes and their tiers
     * name, hashed into each tier's digest; empty when none are supplied.
     */
    models?: ReadonlyMap<string, IAutoMovieModel>;
    /**
     * Supplied root-centered radius estimate in metres keyed by model group id;
     * an id without one borrows its prototype's base group radius and then half
     * a metre.
     */
    projectionRadii?: ReadonlyMap<string, number>;
  };
}
