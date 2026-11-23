import type { AutoMovieArchetype } from "../core";
import { PracticalLightConstruction } from "./PracticalLightConstruction";
import type { createLight } from "./createLight";

/**
 * A standing or hung lantern with a raised bail and a burner light binding.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createLantern(
  params: createLantern.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createLantern.Affordance, createLantern.Dimension> {
  return PracticalLightConstruction.lantern(params, seed);
}

/** The authorable settings and local contact IDs of {@link createLantern}. */
export namespace createLantern {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "bail"
    | "base"
    | "height"
    | "mass"
    | "overall"
    | "shade";

  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "hook" | "light";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createLight.IParams,
    "id" | "height" | "shade" | "overall" | "base" | "bail" | "mass"
  >;
}
