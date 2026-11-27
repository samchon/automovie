import { type AutoMovieArchetype } from "../core/index";
import { createWashbasin as createWashbasinImplementation } from "./internal/createWashbasin";

/** Public operations for Auto Movie Archetype Washbasin. */
export namespace AutoMovieArchetypeWashbasin {
  /**
   * A wall-backed washbasin with a rim, tap lever and spout contact.
   *
   * The mixer tap and lift retain their shared lever and parented articulation in
   * `SanitaryConstruction.washbasin`. The fixture is centred on X, with its back
   * at Z = 0 and its front towards +Z.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeWashbasin.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeWashbasin.Affordance, AutoMovieArchetypeWashbasin.Dimension> {
    return createWashbasinImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "bowl" | "lift" | "rim" | "spout" | "tap";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "basinDepth"
    | "bowlDepth"
    | "bowlWidth"
    | "depth"
    | "mass"
    | "rim"
    | "tapHeight"
    | "tapOutlet"
    | "tapReach"
    | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }}
