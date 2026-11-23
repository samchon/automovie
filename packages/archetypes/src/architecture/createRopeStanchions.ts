import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { ObstacleDraw } from "./ObstacleDraw";

/**
 * Two freestanding stanchions with grip frames on their shafts and the rope between them.
 *
 * The measured dimensions set the foot clearance and positions of the three bar contacts. The rope stays straight as in the saved design.
 * The object stands on Y = 0 and is approached from +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The measured dimensions set the foot clearance and positions of the three bar contacts. The rope stays straight as in the saved design.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the fixed measurements, then place the obstruction and its available contact frames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createRopeStanchions(
  params: createRopeStanchions.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createRopeStanchions.Affordance,
  createRopeStanchions.Dimension
> {
  const {
    builder,
    d,
  }: ObstacleDraw.IObstacle<createRopeStanchions.Affordance> =
    ObstacleDraw.begin(
      "ropeAndPosts",
      "rope and posts",
      "composite",
      params,
      seed,
    );
  const v: typeof Vector3.create = Vector3.create;
  const length: number = d.length!;
  const height: number = d.height!;
  const r: number = d.post! / 2;
  const z: number = d.base! / 2;
  const hang: number = height - d.ropeDiameter! / 2;
  for (const [id, sign] of [
    ["leftPost", 1],
    ["rightPost", -1],
  ] as const) {
    const x: number = (sign * length) / 2;
    builder.rod(
      `${id}-base`,
      d.base! / 2,
      v(x, 0, z),
      v(x, createRopeStanchions.BASE_THICKNESS, z),
      {
        color: "#55595f",
      },
    );
    builder.rod(
      `${id}-post`,
      r,
      v(x, createRopeStanchions.BASE_THICKNESS, z),
      v(x, height, z),
      {
        color: "#c9a845",
      },
    );
    builder.affordance({
      id,
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, height / 2, z),
        v(0, 0, 1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.post!,
      length: height,
    });
  }
  builder.rod(
    "rope",
    d.ropeDiameter! / 2,
    v(-length / 2 + r, hang, z),
    v(length / 2 - r, hang, z),
    {
      color: "#8a1c2b",
    },
  );
  builder.affordance({
    id: "rope",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, hang, z),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.ropeDiameter!,
    length: length - d.post!,
  });
  return builder.build(d.mass!);
}

/**
 * Inputs, dimensions and contacts for {@link createRopeStanchions}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createRopeStanchions {
  /** The named contacts built by this producer. */
  export type Affordance = "leftPost" | "rightPost" | "rope";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "base"
    | "height"
    | "length"
    | "mass"
    | "post"
    | "ropeDiameter";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }

  /** The estimated round base thickness, metres. */
  export const BASE_THICKNESS: number = 0.03;
}
