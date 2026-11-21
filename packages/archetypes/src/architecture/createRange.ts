import type { Archetype } from "../core";
import { APPLIANCE_BANDS } from "./APPLIANCE_BANDS";
import { ApplianceConstruction } from "./ApplianceConstruction";
import { FixtureDraw } from "./FixtureDraw";
import type { createAppliance } from "./createAppliance";

/**
 * A freestanding range with a cooktop and four pan landing surfaces.
 *
 * The hob and its four load surfaces remain in `ApplianceConstruction.cooker`; the visible oven door and knobs carry no motion contacts.
 * The fixture is centred on X, with its back at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {ArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The hob and its four load surfaces remain in `ApplianceConstruction.cooker`; the visible oven door and knobs carry no motion contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the designated band row, then build the selected construction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createRange(
  params: createRange.IParams = {},
  seed?: number | string,
): Archetype<createRange.Affordance, createRange.Dimension> {
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

/**
 * Inputs, dimensions and contacts for {@link createRange}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
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
