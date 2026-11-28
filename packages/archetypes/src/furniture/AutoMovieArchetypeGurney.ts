import { type AutoMovieArchetype } from "../core/index";
import { createGurney as createGurneyImplementation } from "./internal/createGurney";
import { type AutoMovieArchetypeBed } from "./AutoMovieArchetypeBed";

/** Constructs a caster stretcher with a mattress and long-edge seat frames. */
export namespace AutoMovieArchetypeGurney {
  /**
   * Build a stretcher with four casters, a litter and a mattress.
   *
   * @param params Optional ID and fixed values in the stretcher bands.
   *   The ID defaults to `bed`.
   * @param seed Numeric seed for omitted dimensions. Without it the
   *   litter is 0.6955 metres and the mattress top is 0.8355 metres high.
   * @returns The patient `surface` and two side-edge seats.
   * @throws {AutoMovieArchetypeRefusal} If a fixed dimension is inadmissible.
   */
  export function create(params?: AutoMovieArchetypeGurney.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeGurney.Affordance, AutoMovieArchetypeGurney.Dimension> {
    return createGurneyImplementation(params, seed);
  }

  /**
   * Patient and base footprint, litter height and mattress thickness in metres, plus empty stretcher mass in kilograms.
   */
  export type Dimension =
    | "length"
    | "litter"
    | "mass"
    | "overallLength"
    | "overallWidth"
    | "thickness"
    | "width";

  /**
   * The `surface` at litter height plus mattress thickness, with opposed side-edge seats.
   */
  export type Affordance = "leftSide" | "rightSide" | "surface";

  /**
   * Optional ID and fixed stretcher band dimensions, including litter height and empty body mass.
   */
  export type IParams = Pick<
    AutoMovieArchetypeBed.IParams,
    | "id"
    | "width"
    | "length"
    | "overallLength"
    | "overallWidth"
    | "litter"
    | "thickness"
    | "mass"
  >;}
