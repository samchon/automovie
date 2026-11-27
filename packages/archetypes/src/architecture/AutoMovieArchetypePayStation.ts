import { type AutoMovieArchetype } from "../core/index";
import { createPayStation as createPayStationImplementation } from "./internal/createPayStation";

/** Public operations for Auto Movie Archetype Pay Station. */
export namespace AutoMovieArchetypePayStation {
  /**
   * A parking pay station with a raised control head, a front contact and a side
   * contact.
   *
   * The measured StradaPAL cabinet, spacer and head preserve the installation's
   * dimensions. The measured contact set covers its exterior faces. The cabinet
   * rests on the floor at the origin and faces +Z.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypePayStation.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypePayStation.Affordance, AutoMovieArchetypePayStation.Dimension> {
    return createPayStationImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "front" | "side";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }}
