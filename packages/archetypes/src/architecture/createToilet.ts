import type { AutoMovieArchetype } from "../core";
import { FixtureDraw } from "./FixtureDraw";
import { SANITARY_BANDS } from "./SANITARY_BANDS";
import { SanitaryConstruction } from "./SanitaryConstruction";
import type { createSanitary } from "./createSanitary";

/**
 * A wall-backed toilet with a forward-facing seat and a lowering lid.
 *
 * The open lid moves on its existing hinge to the seat. The seat offer keeps
 * the recorded front edge at the drawn height. The fixture is centred on X,
 * with its back at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createToilet(
  params: createToilet.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createToilet.Affordance, createToilet.Dimension> {
  return FixtureDraw.installed<
    createToilet.Affordance,
    createSanitary.Dimension
  >(
    "sanitary",
    "toilet",
    FixtureDraw.sanitary,
    SANITARY_BANDS.toilet,
    SANITARY_BANDS,
    params,
    seed,
    SanitaryConstruction.toilet,
  );
}

/** Inputs, dimensions and contacts for {@link createToilet}. */
export namespace createToilet {
  /** The named contacts built by this producer. */
  export type Affordance = "lid" | "seat";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "length"
    | "mass"
    | "seat"
    | "seatDepth"
    | "tankDepth"
    | "tankTop"
    | "tankWidth"
    | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }
}
