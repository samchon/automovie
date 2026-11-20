import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { StreetFixtureDraw } from "./StreetFixtureDraw";
import type { createStreetFixture } from "./createStreetFixture";

/**
 * A ground-standing steel bollard with a shaft grip and a top surface.
 *
 * The installed height and selected Reliance pipe diameter supply the shaft, its bar and its top support.
 * The lowest point of the fixture stands on Y = 0.
 *
 * @param params The scene identifier, model choice and supported dimension overrides.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {ArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The installed height and selected Reliance pipe diameter supply the shaft, its bar and its top support.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the fixed measurements, then record the parts and their typed contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createBollard(
  params: createBollard.IParams = {},
  seed?: number | string,
): Archetype<createBollard.Affordance, createStreetFixture.Dimension> {
  const { builder, d }: StreetFixtureDraw.IFixture<createBollard.Affordance> =
    StreetFixtureDraw.begin("bollard", "bollard", "steel", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const diameter: number = d.diameter!;
  builder.rod("shaft", diameter / 2, v(0, 0, 0), v(0, height, 0), {
    color: "#e2b714",
    surface: "steel",
  });
  StreetFixtureDraw.shaft(builder, 0, height, diameter);
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, height, 0)),
    extent: null,
    width: diameter,
    depth: diameter,
  });
  return builder.build(d.mass!, { rests: "steel" });
}

/**
 * Inputs, dimensions and contacts for {@link createBollard}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms. The model fixes the pipe diameter and mass.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides. The model fixes the pipe diameter and mass.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createBollard {
  /** The named contacts built by this producer. */
  export type Affordance = "post" | "top";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "height";

  /** The numeric overrides and optional scene identifier. The model fixes the pipe diameter and mass. */
  export type IParams = Partial<Record<Dimension, number>> & {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;

    /** The measured pipe model, drawn from the seed when omitted. */
    model?: "R-1007-04" | "R-1007-06" | "R-1007-08" | "R-1007-10";
  };
}
