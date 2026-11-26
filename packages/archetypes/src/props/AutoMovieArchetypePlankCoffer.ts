import { type AutoMovieArchetype } from "../core/index";
import { createPlankCoffer as createPlankCofferImplementation } from "./internal/createPlankCoffer";
import { type createScenicContainer } from "./createScenicContainer";

/** Public operations for Auto Movie Archetype Plank Coffer. */
export namespace AutoMovieArchetypePlankCoffer {
  /**
   * A closed plank coffer with a rectangular top suitable for stacking.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params?: AutoMovieArchetypePlankCoffer.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypePlankCoffer.Affordance,
  AutoMovieArchetypePlankCoffer.Dimension
> {
    return createPlankCofferImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "top";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;}
