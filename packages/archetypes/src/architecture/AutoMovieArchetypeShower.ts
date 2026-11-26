import { type AutoMovieArchetype } from "../core/index";
import { createShower as createShowerImplementation } from "./internal/createShower";

/** Public operations for Auto Movie Archetype Shower. */
export namespace AutoMovieArchetypeShower {
  /**
   * A front-entry transfer shower with a threshold, floor, wall seat and opposite
   * valve.
   *
   * The threshold, tray and seat retain their original support and the valve
   * retains its location on the opposite wall. The fixture is centred on X, with
   * its back at Z = 0 and its front towards +Z.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeShower.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeShower.Affordance, AutoMovieArchetypeShower.Dimension> {
    return createShowerImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "control" | "entry" | "seat" | "threshold" | "tray";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "control"
    | "interior"
    | "mass"
    | "seat"
    | "seatDepth"
    | "threshold"
    | "wallHeight";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }}
