import { type AutoMovieArchetype } from "../core/index";
import { createMoldedCrate as createMoldedCrateImplementation } from "./internal/createMoldedCrate";
import { type createScenicContainer } from "./createScenicContainer";

/** Public operations for Auto Movie Archetype Molded Crate. */
export namespace AutoMovieArchetypeMoldedCrate {
  /**
   * An open molded crate with a floor suitable for receiving arranged loads.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params?: AutoMovieArchetypeMoldedCrate.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeMoldedCrate.Affordance,
  AutoMovieArchetypeMoldedCrate.Dimension
> {
    return createMoldedCrateImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "inside";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;}
