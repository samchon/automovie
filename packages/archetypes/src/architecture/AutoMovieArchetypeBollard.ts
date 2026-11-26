import { type AutoMovieArchetype } from "../core/index";
import { createBollard as createBollardImplementation } from "./internal/createBollard";

/** Public operations for Auto Movie Archetype Bollard. */
export namespace AutoMovieArchetypeBollard {
  /**
   * A ground-standing steel bollard with a shaft grip and a top surface.
   *
   * The installed height and selected Reliance pipe diameter supply the shaft,
   * its bar and its top support. The lowest point of the fixture stands on Y =
   * 0.
   *
   * @param params The scene identifier, model choice and supported dimension
   *   overrides.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeBollard.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeBollard.Affordance, AutoMovieArchetypeBollard.Dimension> {
    return createBollardImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model = "R-1007-04" | "R-1007-06" | "R-1007-08" | "R-1007-10";

  /** The named contacts built by this producer. */
  export type Affordance = "post" | "top";

  /** The dimensions an author may fix, in the same units. */
  export type Fixed = "height";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /**
   * The numeric overrides and optional scene identifier. The model fixes the
   * pipe diameter and mass.
   */
  export interface IParams extends Partial<Record<Fixed, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;

    /** The measured pipe model, drawn from the seed when omitted. */
    model?: Model;
  }}
