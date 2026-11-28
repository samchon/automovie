import { type AutoMovieArchetype } from "../core/index";
import { createMattress as createMattressImplementation } from "./internal/createMattress";
import { type AutoMovieArchetypeBed } from "./AutoMovieArchetypeBed";

/** Constructs a loose mattress with a UK catalogue footprint. */
export namespace AutoMovieArchetypeMattress {
  /**
   * Build a mattress resting directly on the floor.
   *
   * @param params Optional catalogue `size`, scene ID, thickness and mass.
   *   The ID defaults to `bed`.
   * @param seed Numeric seed for an omitted catalogue size and band
   *   values. Omit it for the 0.90 by 1.90 metre single and 0.20 metre
   *   thickness.
   * @returns The mattress top surface and two long-edge seats.
   * @throws {AutoMovieArchetypeRefusal} If a size or fixed dimension is inadmissible.
   */
  export function create(params?: AutoMovieArchetypeMattress.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeMattress.Affordance, AutoMovieArchetypeMattress.Dimension> {
    return createMattressImplementation(params, seed);
  }

  /**
   * Catalogue width and length and drawn thickness in metres, plus mass in kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";

  /** The upper `surface` and seats facing out from both long edges. */
  export type Affordance = "leftSide" | "rightSide" | "surface";

  /**
   * Optional ID, UK catalogue size, fixed thickness in metres and mass in kilograms.
   */
  export type IParams = Pick<
    AutoMovieArchetypeBed.IParams,
    "id" | "size" | "thickness" | "mass"
  >;}
