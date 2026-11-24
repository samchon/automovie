import type { AutoMovieArchetype } from "../core";
import { FixtureDraw } from "./FixtureDraw";
import { SANITARY_BANDS } from "./SANITARY_BANDS";
import { SanitaryConstruction } from "./SanitaryConstruction";
import type { createSanitary } from "./createSanitary";

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
export function createShower(
  params: createShower.IParams = {},
  seed?: number,
): AutoMovieArchetype<createShower.Affordance, createShower.Dimension> {
  return FixtureDraw.installed<
    createShower.Affordance,
    createSanitary.Dimension
  >(
    "sanitary",
    "transfer shower",
    FixtureDraw.sanitary,
    SANITARY_BANDS.shower,
    SANITARY_BANDS,
    params,
    seed,
    SanitaryConstruction.shower,
  );
}

/** Inputs, dimensions and contacts for {@link createShower}. */
export namespace createShower {
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
  }
}
