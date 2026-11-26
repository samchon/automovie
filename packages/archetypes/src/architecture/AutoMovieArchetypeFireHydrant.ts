import { type AutoMovieArchetype } from "../core/index";
import { createFireHydrant as createFireHydrantImplementation } from "./internal/createFireHydrant";

/** Public operations for Auto Movie Archetype Fire Hydrant. */
export namespace AutoMovieArchetypeFireHydrant {
  /**
   * A ground-standing hydrant with one pumper and two hose socket frames, plus
   * its operating nut.
   *
   * The pumper points toward +Z and the hose sockets toward each side. All three
   * sockets sit on their corresponding nozzle faces. The lowest point of the
   * fixture stands on Y = 0.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeFireHydrant.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeFireHydrant.Affordance,
  AutoMovieArchetypeFireHydrant.Dimension
> {
    return createFireHydrantImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "hoseLeft" | "hoseRight" | "nut" | "pumper";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "diameter"
    | "height"
    | "hoseReach"
    | "mass"
    | "nozzleHeight"
    | "pumperReach";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }}
