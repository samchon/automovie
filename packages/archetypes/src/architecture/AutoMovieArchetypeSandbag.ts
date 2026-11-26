import { type AutoMovieArchetype } from "../core/index";
import { createSandbag as createSandbagImplementation } from "./internal/createSandbag";

/** Public operations for Auto Movie Archetype Sandbag. */
export namespace AutoMovieArchetypeSandbag {
  /**
   * A filled sandbag with a low crossing surface and a grasp at each end.
   *
   * The laid bag's nominal section defines the crossing rise and depth; end
   * grasps keep their own centres. The object stands on Y = 0 and is approached
   * from +Z.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeSandbag.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeSandbag.Affordance, AutoMovieArchetypeSandbag.Dimension> {
    return createSandbagImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "edge" | "leftEnd" | "rightEnd" | "top";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "height" | "length" | "mass" | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }}
