import { type AutoMovieArchetype } from "../core";
import { ServiceCabinet } from "./ServiceCabinet";
import type { createMachine } from "./createMachine";

/**
 * A snack vending machine with the front and right side of its standing cabinet available for actor contacts.
 *
 * The Merchant 4 and Merchant 6 figures choose the cabinet width as a whole model, while mass comes from the measured band.
 * The cabinet rests on the floor at the origin and faces +Z.
 *
 * @param params The scene identifier, measured model and inside-band dimension overrides.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The Merchant 4 and Merchant 6 figures choose the cabinet width as a whole model, while mass comes from the measured band.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the cabinet, then record its fixture-specific parts and the common exterior faces.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the shared rectangle for the standing cabinet and the same geometry through both entry points.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createVendingMachine(
  params: createVendingMachine.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createVendingMachine.Affordance,
  createVendingMachine.Dimension
> {
  const cabinet: ServiceCabinet.ICabinet<createVendingMachine.Affordance> =
    ServiceCabinet.begin(
      "vendingMachine",
      "vending machine",
      "#b3202a",
      params,
      seed,
    );
  ServiceCabinet.faces(cabinet);
  return cabinet.builder.build(cabinet.mass);
}

/**
 * Inputs, dimensions and contacts for {@link createVendingMachine}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms. The model selects the manufacturer's fixed width.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides. The model selects the manufacturer's fixed width.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createVendingMachine {
  /** The named contacts built by this producer. */
  export type Affordance = "front" | "side";

  /** The dimensions an author may fix, in the same units. */
  export type Fixed = "height" | "depth" | "mass";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The numeric overrides and optional scene identifier. The model selects the manufacturer's fixed width. */
  export interface IParams extends Partial<Record<Fixed, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;

    /** The measured model, drawn by seed when omitted. */
    model?: createMachine.Model;
  }
}
