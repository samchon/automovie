import { Vector3 } from "@automovie/engine";

import { type Archetype } from "../core";
import { ServiceCabinet } from "./ServiceCabinet";
import type { createMachine } from "./createMachine";

/** A pay station's head on its body, metres: the StradaPAL's 90 mm spacer and its 475 x 226 x 379 mm top. */
const HEAD: Readonly<{
  spacer: number;
  width: number;
  height: number;
  depth: number;
}> = { spacer: 0.09, width: 0.475, height: 0.226, depth: 0.379 };

/**
 * A parking pay station with a raised control head, a front contact and a side contact.
 *
 * The measured StradaPAL cabinet, spacer and head preserve the installation's dimensions. The measured contact set covers its exterior faces.
 * The cabinet rests on the floor at the origin and faces +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {ArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The measured StradaPAL cabinet, spacer and head preserve the installation's dimensions. The measured contact set covers its exterior faces.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the cabinet, then record its fixture-specific parts and the common exterior faces.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the shared rectangle for the standing cabinet and the same geometry through both entry points.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createPayStation(
  params: createPayStation.IParams = {},
  seed?: number | string,
): Archetype<createPayStation.Affordance, createPayStation.Dimension> {
  const cabinet: ServiceCabinet.ICabinet<createPayStation.Affordance> =
    ServiceCabinet.begin("payStation", "pay station", "#2b5797", params, seed);
  const {
    builder,
    width,
    height,
    depth,
  }: ServiceCabinet.ICabinet<createPayStation.Affordance> = cabinet;
  const v: typeof Vector3.create = Vector3.create;
  builder.box(
    "spacer",
    v(width, HEAD.spacer, depth),
    v(0, height + HEAD.spacer / 2, 0),
    { color: "#2b5797" },
  );
  builder.box(
    "head",
    v(HEAD.width, HEAD.height, HEAD.depth),
    v(0, height + HEAD.spacer + HEAD.height / 2, 0),
    { color: "#2b5797" },
  );
  ServiceCabinet.faces(cabinet);
  return cabinet.builder.build(cabinet.mass);
}

/**
 * Inputs, dimensions and contacts for {@link createPayStation}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createPayStation {
  /** The named contacts built by this producer. */
  export type Affordance = "front" | "side";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }
}
