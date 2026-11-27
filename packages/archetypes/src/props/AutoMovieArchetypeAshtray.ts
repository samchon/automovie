import { type AutoMovieArchetype } from "../core/index";
import { createAshtray as createAshtrayImplementation } from "./internal/createAshtray";
import { type AutoMovieArchetypeVessel } from "./AutoMovieArchetypeVessel";

/** Public operations for Auto Movie Archetype Ashtray. */
export namespace AutoMovieArchetypeAshtray {
  /**
   * An ashtray with an inside floor and a precision grip from beneath.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params?: AutoMovieArchetypeAshtray.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeAshtray.Affordance, AutoMovieArchetypeAshtray.Dimension> {
    return createAshtrayImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model = "nachtmann" | "harris";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** The contact IDs declared by this producer. */
  export type Affordance = "body" | "inside" | "rim";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<AutoMovieArchetypeVessel.IParams, "id"> {
    /** The recorded ashtray. The seed selects it when omitted. */
    model?: Model;
  }}
