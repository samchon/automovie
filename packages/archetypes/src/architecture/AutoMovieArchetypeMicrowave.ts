import { type AutoMovieArchetype } from "../core/index";
import { createMicrowave as createMicrowaveImplementation } from "./internal/createMicrowave";

/** Public operations for Auto Movie Archetype Microwave. */
export namespace AutoMovieArchetypeMicrowave {
  /**
   * A countertop microwave with a cavity floor, a top support and a left-hinged
   * door.
   *
   * The cavity floor and cabinet top retain their stack contacts. The door
   * carries no travel because the measured source gives no opening angle. The
   * fixture is centred on X, with its back at Z = 0 and its front towards +Z.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeMicrowave.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeMicrowave.Affordance, AutoMovieArchetypeMicrowave.Dimension> {
    return createMicrowaveImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "door" | "floor" | "top";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "cavityDepth"
    | "cavityHeight"
    | "cavityWidth"
    | "depth"
    | "height"
    | "mass"
    | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }}
