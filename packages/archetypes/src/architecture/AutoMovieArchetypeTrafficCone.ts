import { type AutoMovieArchetype } from "../core/index";
import { createTrafficCone as createTrafficConeImplementation } from "./internal/createTrafficCone";

/** Public operations for Auto Movie Archetype Traffic Cone. */
export namespace AutoMovieArchetypeTrafficCone {
  /**
   * A stepped traffic cone with its top grasp and square base on the pavement.
   *
   * The Brimar proportions shape the cone after the chosen height class and its
   * original mass draw. The lowest point of the fixture stands on Y = 0.
   *
   * @param params The scene identifier, model choice and supported dimension
   *   overrides.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeTrafficCone.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeTrafficCone.Affordance,
  AutoMovieArchetypeTrafficCone.Dimension
> {
    return createTrafficConeImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model = "cone 18 in" | "cone 28 in";

  /** The named contacts built by this producer. */
  export type Affordance = "top";

  /** The dimensions an author may fix, in the same units. */
  export type Fixed = "mass";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height" | "mass";

  /**
   * The numeric overrides and optional scene identifier. The model fixes the
   * height class.
   */
  export interface IParams extends Partial<Record<Fixed, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;

    /** The road-class model, drawn from the seed when omitted. */
    model?: Model;
  }}
