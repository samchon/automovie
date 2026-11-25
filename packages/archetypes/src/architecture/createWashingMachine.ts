import type { AutoMovieArchetype } from "../core";
import { APPLIANCE_BANDS } from "./APPLIANCE_BANDS";
import { ApplianceConstruction } from "./ApplianceConstruction";
import { FixtureDraw } from "./FixtureDraw";
import type { createAppliance } from "./createAppliance";

/**
 * A front-loading washing machine with a hinged round door, a physically hollow
 * drum and a worktop. The door opens 160 degrees and carries its handle; the
 * drum keeps its opening, the loading waypoints and the seat a load rests on
 * fixed in the body.
 *
 * The construction retains the washer's round door pieces, left hinge and
 * horizontal worktop. The fixture is centred on X, with its back at Z = 0 and
 * its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createWashingMachine(
  params: createWashingMachine.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createWashingMachine.Affordance,
  createWashingMachine.Dimension
> {
  return FixtureDraw.installed<
    createWashingMachine.Affordance,
    createAppliance.Dimension
  >(
    "appliance",
    "washing machine",
    FixtureDraw.appliance,
    APPLIANCE_BANDS.washingMachine,
    APPLIANCE_BANDS,
    params,
    seed,
    ApplianceConstruction.washingMachine,
  );
}

/** Inputs, dimensions and contacts for {@link createWashingMachine}. */
export namespace createWashingMachine {
  /** The named contacts built by this producer. */
  export type Affordance =
    | "door"
    | "doorHandle"
    | "drumAperture"
    | "loadApproach"
    | "loadAlign"
    | "loadOpening"
    | "drumEntry"
    | "drumSeat"
    | "top";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "depth" | "door" | "height" | "mass" | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }
}
