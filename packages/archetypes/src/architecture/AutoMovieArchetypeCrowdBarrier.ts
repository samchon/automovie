import { type AutoMovieArchetype } from "../core/index";
import { createCrowdBarrier as createCrowdBarrierImplementation } from "./internal/createCrowdBarrier";

/** Public operations for Auto Movie Archetype Crowd Barrier. */
export namespace AutoMovieArchetypeCrowdBarrier {
  /**
   * A steel crowd barrier with feet, pickets and an accessible upper rail.
   *
   * The frame's drawn height, tube size and picket spacing place a grip on its
   * real upper rail. The object stands on Y = 0 and is approached from +Z.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeCrowdBarrier.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeCrowdBarrier.Affordance,
  AutoMovieArchetypeCrowdBarrier.Dimension
> {
    return createCrowdBarrierImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "rail";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "height" | "length" | "mass" | "spacing" | "tube";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }

  /** The estimated feet, bottom-rail height and picket diameter, metres. */
  export const ESTIMATES: Readonly<{
    foot: number;
    bottomRail: number;
    picket: number;
  }> = {
    foot: 0.6,
    bottomRail: 0.15,
    picket: 0.016,
  };}
