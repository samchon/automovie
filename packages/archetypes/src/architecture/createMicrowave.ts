import type { AutoMovieArchetype } from "../core";
import { APPLIANCE_BANDS } from "./APPLIANCE_BANDS";
import { ApplianceConstruction } from "./ApplianceConstruction";
import { FixtureDraw } from "./FixtureDraw";
import type { createAppliance } from "./createAppliance";

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
export function createMicrowave(
  params: createMicrowave.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createMicrowave.Affordance, createMicrowave.Dimension> {
  return FixtureDraw.installed<
    createMicrowave.Affordance,
    createAppliance.Dimension
  >(
    "appliance",
    "microwave",
    FixtureDraw.appliance,
    APPLIANCE_BANDS.microwave,
    APPLIANCE_BANDS,
    params,
    seed,
    ApplianceConstruction.microwave,
  );
}

/** Inputs, dimensions and contacts for {@link createMicrowave}. */
export namespace createMicrowave {
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
  }
}
