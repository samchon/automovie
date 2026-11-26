import { type AutoMovieArchetype } from "../core/index";
import { createPendantLamp as createPendantLampImplementation } from "./internal/createPendantLamp";
import { type createLight } from "./createLight";

/** Public operations for Auto Movie Archetype Pendant Lamp. */
export namespace AutoMovieArchetypePendantLamp {
  /**
   * A hanging pendant lamp with its ceiling hook at the origin.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params?: AutoMovieArchetypePendantLamp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypePendantLamp.Affordance,
  AutoMovieArchetypePendantLamp.Dimension
> {
    return createPendantLampImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "cord" | "height" | "mass" | "shade";

  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "hook" | "light";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createLight.IParams,
    "id" | "height" | "shade" | "cord" | "mass"
  >;}
