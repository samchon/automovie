import { type AutoMovieArchetype } from "../core/index";
import { createLampPost as createLampPostImplementation } from "./internal/createLampPost";

/** Public operations for Auto Movie Archetype Lamp Post. */
export namespace AutoMovieArchetypeLampPost {
  /**
   * A lamp post with a ground base, upright grip and post-top luminaire.
   *
   * The mounting height and base and luminaire dimensions locate the grip on the
   * shaft. The lowest point of the fixture stands on Y = 0.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeLampPost.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeLampPost.Affordance, AutoMovieArchetypeLampPost.Dimension> {
    return createLampPostImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "post";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "base"
    | "baseHeight"
    | "diameter"
    | "head"
    | "headHeight"
    | "height"
    | "mass";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }}
