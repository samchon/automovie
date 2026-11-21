import type { Archetype } from "../core";
import { APPLIANCE_BANDS } from "./APPLIANCE_BANDS";
import { ApplianceConstruction } from "./ApplianceConstruction";
import { FixtureDraw } from "./FixtureDraw";
import type { createAppliance } from "./createAppliance";

/**
 * A front-loading washing machine with a hinged round door and a worktop.
 *
 * The construction retains the washer's round door pieces, left hinge and horizontal worktop.
 * The fixture is centred on X, with its back at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {ArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The construction retains the washer's round door pieces, left hinge and horizontal worktop.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the designated band row, then build the selected construction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createWashingMachine(
  params: createWashingMachine.IParams = {},
  seed?: number | string,
): Archetype<createWashingMachine.Affordance, createWashingMachine.Dimension> {
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

/**
 * Inputs, dimensions and contacts for {@link createWashingMachine}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createWashingMachine {
  /** The named contacts built by this producer. */
  export type Affordance = "door" | "top";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "depth" | "door" | "height" | "mass" | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }
}
