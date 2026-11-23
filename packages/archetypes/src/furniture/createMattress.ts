import type { AutoMovieArchetype } from "../core";
import { BedConstruction } from "./BedConstruction";
import type { createBed } from "./createBed";

/**
 * A loose mattress set directly on its floor with a lying surface and side
 * contacts.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createMattress(
  params: createMattress.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createMattress.Affordance, createMattress.Dimension> {
  return BedConstruction.platform("mattress", params, seed);
}

/** The authorable settings and local contact IDs of {@link createMattress}. */
export namespace createMattress {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "leftSide" | "rightSide" | "surface";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createBed.IParams,
    "id" | "size" | "thickness" | "mass"
  >;
}
