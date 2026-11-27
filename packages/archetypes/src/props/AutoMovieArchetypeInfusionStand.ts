import { type AutoMovieArchetype } from "../core/index";
import { createInfusionStand as createInfusionStandImplementation } from "./internal/createInfusionStand";
import { type AutoMovieArchetypeMobilityAid } from "./AutoMovieArchetypeMobilityAid";

/** Public operations for Auto Movie Archetype Infusion Stand. */
export namespace AutoMovieArchetypeInfusionStand {
  /**
   * A mobile infusion stand with a tube grip and a top bag hook.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params?: AutoMovieArchetypeInfusionStand.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeInfusionStand.Affordance,
  AutoMovieArchetypeInfusionStand.Dimension
> {
    return createInfusionStandImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "hook" | "tip";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    AutoMovieArchetypeMobilityAid.IParams,
    "id" | "height" | "diameter" | "width" | "mass"
  >;}
