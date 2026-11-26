import { type AutoMovieArchetype } from "../core/index";
import { createLantern as createLanternImplementation } from "./internal/createLantern";
import { type createLight } from "./createLight";

/** Public operations for Auto Movie Archetype Lantern. */
export namespace AutoMovieArchetypeLantern {
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
  export function create(params?: AutoMovieArchetypeLantern.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeLantern.Affordance, AutoMovieArchetypeLantern.Dimension> {
    return createLanternImplementation(params, seed);
  }

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
  >;}
