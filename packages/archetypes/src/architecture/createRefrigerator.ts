import type { AutoMovieArchetype } from "../core";
import { APPLIANCE_BANDS } from "./APPLIANCE_BANDS";
import { ApplianceConstruction } from "./ApplianceConstruction";
import { FixtureDraw } from "./FixtureDraw";
import type { createAppliance } from "./createAppliance";

/**
 * A wall-backed fridge-freezer with right-hinged doors, attached handles and
 * four shelf landing surfaces.
 *
 * The hollow cabinet and four shelves remain in
 * `ApplianceConstruction.refrigerator`; each door carries its handle. The
 * fixture is centred on X, with its back at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createRefrigerator(
  params: createRefrigerator.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createRefrigerator.Affordance,
  createRefrigerator.Dimension
> {
  return FixtureDraw.installed<
    createRefrigerator.Affordance,
    createAppliance.Dimension
  >(
    "appliance",
    "fridge-freezer",
    FixtureDraw.appliance,
    APPLIANCE_BANDS.refrigerator,
    APPLIANCE_BANDS,
    params,
    seed,
    ApplianceConstruction.refrigerator,
  );
}

/** Inputs, dimensions and contacts for {@link createRefrigerator}. */
export namespace createRefrigerator {
  /** The named contacts built by this producer. */
  export type Affordance =
    | "freezerDoor"
    | "freezerHandle"
    | "fridgeDoor"
    | "fridgeHandle"
    | `shelf${number}`;

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "depth" | "height" | "mass" | "pullHeight" | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }
}
