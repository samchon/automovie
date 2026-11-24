import type { AutoMovieArchetype } from "../core";
import { BedConstruction } from "./BedConstruction";
import type { createBed } from "./createBed";

/**
 * A crib with a surrounding slat frame and grasp bars on both sides.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createCrib(
  params: createCrib.IParams = {},
  seed?: number,
): AutoMovieArchetype<createCrib.Affordance, createCrib.Dimension> {
  return BedConstruction.crib(params, seed);
}

/** The authorable settings and local contact IDs of {@link createCrib}. */
export namespace createCrib {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "height"
    | "length"
    | "mass"
    | "rail"
    | "thickness"
    | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "leftRail" | "rightRail" | "surface";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createBed.IParams,
    "id" | "width" | "length" | "height" | "rail" | "thickness" | "mass"
  >;
}
