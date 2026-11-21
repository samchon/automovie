import type { Archetype } from "../core";
import { FixtureDraw } from "./FixtureDraw";
import { SANITARY_BANDS } from "./SANITARY_BANDS";
import { SanitaryConstruction } from "./SanitaryConstruction";
import type { createSanitary } from "./createSanitary";

/**
 * A wall-backed bathtub with a front rim and a well floor.
 *
 * The well's floor and front rim retain their measured support locations. A separate room control supplies the plumbing action.
 * The fixture is centred on X, with its back at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {ArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The well's floor and front rim retain their measured support locations. A separate room control supplies the plumbing action.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the designated band row, then build the selected construction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createBathtub(
  params: createBathtub.IParams = {},
  seed?: number | string,
): Archetype<createBathtub.Affordance, createBathtub.Dimension> {
  return FixtureDraw.installed<
    createBathtub.Affordance,
    createSanitary.Dimension
  >(
    "sanitary",
    "bath",
    FixtureDraw.sanitary,
    SANITARY_BANDS.bathtub,
    SANITARY_BANDS,
    params,
    seed,
    SanitaryConstruction.bathtub,
  );
}

/**
 * Inputs, dimensions and contacts for {@link createBathtub}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createBathtub {
  /** The named contacts built by this producer. */
  export type Affordance = "bottom" | "rim";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "length"
    | "mass"
    | "rim"
    | "waterDepth"
    | "wellLength"
    | "wellWidth"
    | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }
}
