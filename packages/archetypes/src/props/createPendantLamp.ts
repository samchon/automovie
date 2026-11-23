import type { AutoMovieArchetype } from "../core";
import { PracticalLightConstruction } from "./PracticalLightConstruction";
import type { createLight } from "./createLight";

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
export function createPendantLamp(
  params: createPendantLamp.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createPendantLamp.Affordance,
  createPendantLamp.Dimension
> {
  return PracticalLightConstruction.pendant(params, seed);
}

/** The authorable settings and local contact IDs of {@link createPendantLamp}. */
export namespace createPendantLamp {
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
  >;
}
