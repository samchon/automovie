import { type AutoMovieArchetype } from "../core/index";
import { createGurney as createGurneyImplementation } from "./internal/createGurney";
import { type createBed } from "./createBed";

/** Public operations for Auto Movie Archetype Gurney. */
export namespace AutoMovieArchetypeGurney {
  /**
   * A caster stretcher with a patient surface and opposed side seats.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params?: AutoMovieArchetypeGurney.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeGurney.Affordance, AutoMovieArchetypeGurney.Dimension> {
    return createGurneyImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "length"
    | "litter"
    | "mass"
    | "overallLength"
    | "overallWidth"
    | "thickness"
    | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "leftSide" | "rightSide" | "surface";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createBed.IParams,
    | "id"
    | "width"
    | "length"
    | "overallLength"
    | "overallWidth"
    | "litter"
    | "thickness"
    | "mass"
  >;}
