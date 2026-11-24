import type { AutoMovieArchetype } from "../core";
import { FixtureDraw } from "./FixtureDraw";
import { SANITARY_BANDS } from "./SANITARY_BANDS";
import { SanitaryConstruction } from "./SanitaryConstruction";
import type { createSanitary } from "./createSanitary";

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
export function createWashbasin(
  params: createWashbasin.IParams = {},
  seed?: number,
): AutoMovieArchetype<createWashbasin.Affordance, createWashbasin.Dimension> {
  return FixtureDraw.installed<
    createWashbasin.Affordance,
    createSanitary.Dimension
  >(
    "sanitary",
    "washbasin",
    FixtureDraw.sanitary,
    SANITARY_BANDS.washbasin,
    SANITARY_BANDS,
    params,
    seed,
    SanitaryConstruction.washbasin,
  );
}

/** Inputs, dimensions and contacts for {@link createWashbasin}. */
export namespace createWashbasin {
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
  }
}
