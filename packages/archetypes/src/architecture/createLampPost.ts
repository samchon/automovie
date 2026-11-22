import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../core";
import { StreetFixtureDraw } from "./StreetFixtureDraw";

/**
 * A lamp post with a ground base, upright grip and post-top luminaire.
 *
 * The mounting height and base and luminaire dimensions locate the grip on the actual shaft.
 * The lowest point of the fixture stands on Y = 0.
 *
 * @param params The scene identifier and any dimensions to fix inside their bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The mounting height and base and luminaire dimensions locate the grip on the actual shaft.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the fixed measurements, then record the parts and their typed contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createLampPost(
  params: createLampPost.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createLampPost.Affordance, createLampPost.Dimension> {
  const { builder, d }: StreetFixtureDraw.IFixture<createLampPost.Affordance> =
    StreetFixtureDraw.begin("lampPost", "lamp post", "composite", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const diameter: number = d.diameter!;
  const foot: number = d.baseHeight!;
  const color: string = "#2f3236";
  builder.rod("base", d.base! / 2, v(0, 0, 0), v(0, foot, 0), { color });
  builder.rod("shaft", diameter / 2, v(0, foot, 0), v(0, height, 0), { color });
  builder.rod(
    "luminaire",
    d.head! / 2,
    v(0, height, 0),
    v(0, height + d.headHeight!, 0),
    { color: "#f4f1e0" },
  );
  StreetFixtureDraw.shaft(builder, foot, height, diameter);
  return builder.build(d.mass!);
}

/**
 * Inputs, dimensions and contacts for {@link createLampPost}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createLampPost {
  /** The named contacts built by this producer. */
  export type Affordance = "post";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "base"
    | "baseHeight"
    | "diameter"
    | "head"
    | "headHeight"
    | "height"
    | "mass";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }
}
