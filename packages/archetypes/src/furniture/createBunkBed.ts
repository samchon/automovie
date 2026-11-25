import type { AutoMovieArchetype } from "../core";
import { BedConstruction } from "./BedConstruction";
import type { createBed } from "./createBed";

/**
 * A stacked pair of beds with lower side seats, an upper sleep surface and a
 * guard bar.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createBunkBed(
  params: createBunkBed.IParams = {},
  seed?: number,
): AutoMovieArchetype<createBunkBed.Affordance, createBunkBed.Dimension> {
  return BedConstruction.bunk(params, seed);
}

/** The authorable settings and local contact IDs of {@link createBunkBed}. */
export namespace createBunkBed {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "clearance"
    | "gap"
    | "height"
    | "length"
    | "mass"
    | "overallLength"
    | "overallWidth"
    | "thickness"
    | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance =
    | "guard"
    | "leftSide"
    | "rightSide"
    | "surface"
    | "upper";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createBed.IParams,
    | "id"
    | "width"
    | "length"
    | "height"
    | "thickness"
    | "overallLength"
    | "overallWidth"
    | "clearance"
    | "gap"
    | "mass"
  >;
}
