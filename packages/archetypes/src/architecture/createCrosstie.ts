import { Vector3 } from "@automovie/engine";

import { type Archetype } from "../core";
import { ObstacleDraw } from "./ObstacleDraw";
import type { createObstacle } from "./createObstacle";

/**
 * A timber railway crosstie with its upper face and forward edge available to a stepping act.
 *
 * The chosen section fixes the rise and depth and the chosen tie length fixes the X span.
 * The object stands on Y = 0 and is approached from +Z.
 *
 * @param params The scene identifier, optional section and length choices, and free mass.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {ArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The chosen section fixes the rise and depth and the chosen tie length fixes the X span.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the fixed measurements, then place the obstruction and its available contact frames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createCrosstie(
  params: createCrosstie.IParams = {},
  seed?: number | string,
): Archetype<createCrosstie.Affordance, createObstacle.Dimension> {
  const { builder, d }: ObstacleDraw.IObstacle<createCrosstie.Affordance> =
    ObstacleDraw.begin("crosstie", "railway crosstie", "wood", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const length: number = d.length!;
  const height: number = d.height!;
  const width: number = d.width!;
  builder.box(
    "crosstie",
    v(length, height, width),
    v(0, height / 2, width / 2),
    {
      color: "#5b4636",
    },
  );
  ObstacleDraw.ledge(builder, height, length, width, width / 2);
  return builder.build(d.mass!);
}

/**
 * Inputs, dimensions and contacts for {@link createCrosstie}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms. Its section and length each select a complete measured profile.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides. Its section and length each select a complete measured profile.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createCrosstie {
  /** The named contacts built by this producer. */
  export type Affordance = "top" | "edge";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "mass";

  /** The numeric overrides and optional scene identifier. Its section and length each select a complete measured profile. */
  export type IParams = Partial<Record<Dimension, number>> & {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;

    /** The measured section, drawn from the seed when omitted. */
    section?: createObstacle.Section;

    /** The measured length, drawn from the seed when omitted. */
    tieLength?: createObstacle.TieLength;
  };
}
