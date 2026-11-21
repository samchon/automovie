import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeUnits } from "../core";
import { ObstacleDraw } from "./ObstacleDraw";

/**
 * A concrete road barrier with its base, upper face and front edge retained for crossing checks.
 *
 * The documented section fixes the high top and projected footprint. The barrier keeps the three-box approximation of the original sloped section.
 * The object stands on Y = 0 and is approached from +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {ArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The documented section fixes the high top and projected footprint. The barrier keeps the three-box approximation of the original sloped section.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the fixed measurements, then place the obstruction and its available contact frames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createJerseyBarrier(
  params: createJerseyBarrier.IParams = {},
  seed?: number | string,
): Archetype<createJerseyBarrier.Affordance, createJerseyBarrier.Dimension> {
  const { builder, d }: ObstacleDraw.IObstacle<createJerseyBarrier.Affordance> =
    ObstacleDraw.begin(
      "jerseyBarrier",
      "concrete barrier",
      "concrete",
      params,
      seed,
    );
  const v: typeof Vector3.create = Vector3.create;
  const length: number = d.length!;
  const base: number = d.width!;
  const curb: number = d.curb!;
  const lower: number = d.lowerFace!;
  const upper: number = d.height! - curb - lower;
  const top: number = d.top!;
  const middle: number =
    base -
    (2 * lower) /
      Math.tan(createJerseyBarrier.LOWER_FACE * ArchetypeUnits.DEGREE);
  const centre: number = base / 2;
  builder.box("curb", v(length, curb, base), v(0, curb / 2, centre), {
    color: "#b5b2aa",
  });
  builder.box(
    "lower",
    v(length, lower, (base + middle) / 2),
    v(0, curb + lower / 2, centre),
    {
      color: "#b5b2aa",
    },
  );
  builder.box(
    "upper",
    v(length, upper, top),
    v(0, curb + lower + upper / 2, centre),
    {
      color: "#b5b2aa",
    },
  );
  ObstacleDraw.ledge(builder, d.height!, length, top, centre);
  return builder.build(d.massPerMetre! * d.length!);
}

/**
 * Inputs, dimensions and contacts for {@link createJerseyBarrier}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createJerseyBarrier {
  /** The named contacts built by this producer. */
  export type Affordance = "edge" | "top";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "curb"
    | "height"
    | "length"
    | "lowerFace"
    | "massPerMetre"
    | "top"
    | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }

  /** Lower-face slope above the ground, degrees, per FHWA-RD-89-036 Figure 1. */
  export const LOWER_FACE: number = 55;
}
