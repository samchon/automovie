import type { AutoMovieArchetype } from "../core";
import { APPLIANCE_BANDS } from "./APPLIANCE_BANDS";
import { ApplianceConstruction } from "./ApplianceConstruction";
import { FixtureDraw } from "./FixtureDraw";
import type { createAppliance } from "./createAppliance";

/**
 * A freestanding range with a cooktop and four pan landing surfaces.
 *
 * The hob and its four load surfaces remain in `ApplianceConstruction.cooker`;
 * the visible oven door and knobs carry no motion contacts. The fixture is
 * centred on X, with its back at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createRange(
  params: createRange.IParams = {},
  seed?: number,
): AutoMovieArchetype<createRange.Affordance, createRange.Dimension> {
  return FixtureDraw.installed<
    createRange.Affordance,
    createAppliance.Dimension
  >(
    "appliance",
    "cooker",
    FixtureDraw.appliance,
    APPLIANCE_BANDS.cooker,
    APPLIANCE_BANDS,
    params,
    seed,
    ApplianceConstruction.cooker,
  );
}

/** Inputs, dimensions and contacts for {@link createRange}. */
export namespace createRange {
  /** The named contacts built by this producer. */
  export type Affordance = "top" | `zone${number}`;

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }
}
