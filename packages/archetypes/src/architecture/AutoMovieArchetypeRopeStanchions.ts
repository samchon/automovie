import { type AutoMovieArchetype } from "../core/index";
import { createRopeStanchions as createRopeStanchionsImplementation } from "./internal/createRopeStanchions";

/** Public operations for Auto Movie Archetype Rope Stanchions. */
export namespace AutoMovieArchetypeRopeStanchions {
  /**
   * Two freestanding stanchions with grip frames on their shafts and the rope
   * between them.
   *
   * The measured dimensions set the foot clearance and positions of the three bar
   * contacts. The rope stays straight as in the saved design. The object stands
   * on Y = 0 and is approached from +Z.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeRopeStanchions.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeRopeStanchions.Affordance,
  AutoMovieArchetypeRopeStanchions.Dimension
> {
    return createRopeStanchionsImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "leftPost" | "rightPost" | "rope";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "base"
    | "height"
    | "length"
    | "mass"
    | "post"
    | "ropeDiameter";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }

  /** The estimated round base thickness, metres. */
  export const BASE_THICKNESS: number = 0.03;}
