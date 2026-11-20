import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { ObstacleDraw } from "./ObstacleDraw";
import type { createObstacle } from "./createObstacle";

/**
 * A filled sandbag with a low crossing surface and a grasp at each end.
 *
 * The laid bag's nominal section defines the crossing rise and depth; end grasps keep their own centres.
 * The object stands on Y = 0 and is approached from +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {ArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The laid bag's nominal section defines the crossing rise and depth; end grasps keep their own centres.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the fixed measurements, then place the obstruction and its available contact frames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createSandbag(
  params: createSandbag.IParams = {},
  seed?: number | string,
): Archetype<createSandbag.Affordance, createObstacle.Dimension> {
  const { builder, d }: ObstacleDraw.IObstacle<createSandbag.Affordance> =
    ObstacleDraw.begin("sandbag", "sandbag", "composite", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const length: number = d.length!;
  const height: number = d.height!;
  const width: number = d.width!;
  builder.box(
    "sandbag",
    v(length, height, width),
    v(0, height / 2, width / 2),
    {
      color: "#b8a47a",
    },
  );
  ObstacleDraw.ledge(builder, height, length, width, width / 2);

  // A bag is lifted by its two ends, a hand on each end's top edge; the grasp reads the bag's own collider for the width.
  for (const [id, sign] of [
    ["leftEnd", 1],
    ["rightEnd", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        v((sign * length) / 2, height, width / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      length: width,
    });
  return builder.build(d.mass!);
}

/**
 * Inputs, dimensions and contacts for {@link createSandbag}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createSandbag {
  /** The named contacts built by this producer. */
  export type Affordance = "top" | "edge" | "leftEnd" | "rightEnd";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "length" | "height" | "width" | "mass";

  /** The numeric overrides and optional scene identifier. */
  export type IParams = Partial<Record<Dimension, number>> & {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  };
}
