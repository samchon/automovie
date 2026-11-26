import { type AutoMovieArchetype } from "../core/index";
import { createSignPost as createSignPostImplementation } from "./internal/createSignPost";

/** Public operations for Auto Movie Archetype Sign Post. */
export namespace AutoMovieArchetypeSignPost {
  /**
   * An upright square post carrying a STOP sign blank above its grip span.
   *
   * The sign faces +Z, and its measured lower edge bounds the upright post
   * contact. The lowest point of the fixture stands on Y = 0. The blank is the
   * R1-1 regular octagon, its across-flats size the model's. `face` is a surface
   * on the blank's front, read with model `+Y` up, whose width and depth are the
   * across-flats size and whose outline is the octagon, so graphics placed in the
   * square's four corners are clipped at the blank's edge. The legend is not
   * drawn here; a production letters it on `face` with its own font.
   *
   * @param params The scene identifier, model choice and supported dimension
   *   overrides.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeSignPost.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeSignPost.Affordance, AutoMovieArchetypeSignPost.Dimension> {
    return createSignPostImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model = "STOP 30 in" | "STOP 36 in";

  /**
   * The named contacts built by this producer: the post's bar and the blank's
   * front `face`.
   */
  export type Affordance = "post" | "face";

  /** The dimensions an author may fix, in the same units. */
  export type Fixed = "height" | "diameter" | "mass";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "head" | "height" | "mass";

  /**
   * The numeric overrides and optional scene identifier. The model fixes the
   * size of the sign blank.
   */
  export interface IParams extends Partial<Record<Fixed, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;

    /** The STOP road class, drawn from the seed when omitted. */
    model?: Model;
  }}
