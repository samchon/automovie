import { type AutoMovieArchetype } from "../core/index";
import { createToilet as createToiletImplementation } from "./internal/createToilet";

/** Public operations for Auto Movie Archetype Toilet. */
export namespace AutoMovieArchetypeToilet {
  /**
   * A wall-backed toilet with a forward-facing seat and a lowering lid.
   *
   * The open lid moves on its existing hinge to the seat. The seat offer keeps
   * the recorded front edge at the drawn height. The fixture is centred on X,
   * with its back at Z = 0 and its front towards +Z.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeToilet.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeToilet.Affordance, AutoMovieArchetypeToilet.Dimension> {
    return createToiletImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "lid" | "seat";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "length"
    | "mass"
    | "seat"
    | "seatDepth"
    | "tankDepth"
    | "tankTop"
    | "tankWidth"
    | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }}
