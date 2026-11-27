import { type AutoMovieArchetype } from "../core/index";
import { createAtm as createAtmImplementation } from "./internal/createAtm";

/** Public operations for Auto Movie Archetype Atm. */
export namespace AutoMovieArchetypeAtm {
  /**
   * A cash machine with a shelf, keypad button, card, cash and receipt sockets
   * and an exposed touchscreen.
   *
   * The shelf and fascia controls retain their measured NCR installation
   * locations. The cabinet rests on the floor at the origin and faces +Z. The
   * touchscreen keeps its read height and lies on the cabinet's front face, read
   * with model `+Y` up: the real screen sits recessed behind the fascia, and the
   * coarse cabinet box has no recess, so the recess is dropped.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeAtm.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeAtm.Affordance, AutoMovieArchetypeAtm.Dimension> {
    return createAtmImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance =
    | "cardReader"
    | "cash"
    | "front"
    | "key5"
    | "receipt"
    | "screen"
    | "side";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }}
