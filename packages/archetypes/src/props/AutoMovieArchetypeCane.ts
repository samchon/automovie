import { type AutoMovieArchetype } from "../core/index";
import { createCane as createCaneImplementation } from "./internal/createCane";
import { type createMobilityAid } from "./createMobilityAid";

/** Public operations for Auto Movie Archetype Cane. */
export namespace AutoMovieArchetypeCane {
  /**
   * An offset walking cane with a handle over its shaft and a downward floor tip.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params?: AutoMovieArchetypeCane.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeCane.Affordance, AutoMovieArchetypeCane.Dimension> {
    return createCaneImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "tip";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createMobilityAid.IParams,
    "id" | "height" | "diameter" | "mass"
  >;}
