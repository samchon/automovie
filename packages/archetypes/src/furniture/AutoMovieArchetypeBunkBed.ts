import { type AutoMovieArchetype } from "../core/index";
import { createBunkBed as createBunkBedImplementation } from "./internal/createBunkBed";
import { type AutoMovieArchetypeBed } from "./AutoMovieArchetypeBed";

/** Public operations for Auto Movie Archetype Bunk Bed. */
export namespace AutoMovieArchetypeBunkBed {
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
  export function create(params?: AutoMovieArchetypeBunkBed.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeBunkBed.Affordance, AutoMovieArchetypeBunkBed.Dimension> {
    return createBunkBedImplementation(params, seed);
  }

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
    AutoMovieArchetypeBed.IParams,
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
  >;}
