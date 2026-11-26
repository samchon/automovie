import { type AutoMovieArchetype } from "../core/index";
import { createJerseyBarrier as createJerseyBarrierImplementation } from "./internal/createJerseyBarrier";

/** Public operations for Auto Movie Archetype Jersey Barrier. */
export namespace AutoMovieArchetypeJerseyBarrier {
  /**
   * A concrete road barrier with its base, upper face and front edge retained for
   * crossing checks.
   *
   * The documented section fixes the high top and projected footprint. The
   * barrier keeps the three-box approximation of the original sloped section. The
   * object stands on Y = 0 and is approached from +Z.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeJerseyBarrier.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeJerseyBarrier.Affordance,
  AutoMovieArchetypeJerseyBarrier.Dimension
> {
    return createJerseyBarrierImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "edge" | "top";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "curb"
    | "height"
    | "length"
    | "lowerFace"
    | "massPerMetre"
    | "top"
    | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }

  /** Lower-face slope above the ground, degrees, per FHWA-RD-89-036 Figure 1. */
  export const LOWER_FACE: number = 55;}
