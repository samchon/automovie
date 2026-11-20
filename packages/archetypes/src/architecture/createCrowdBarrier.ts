import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { ObstacleDraw } from "./ObstacleDraw";
import type { createObstacle } from "./createObstacle";

/**
 * A steel crowd barrier with feet, pickets and an accessible upper rail.
 *
 * The frame's drawn height, tube size and picket spacing place a grip on its real upper rail.
 * The object stands on Y = 0 and is approached from +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {ArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The frame's drawn height, tube size and picket spacing place a grip on its real upper rail.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the fixed measurements, then place the obstruction and its available contact frames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createCrowdBarrier(
  params: createCrowdBarrier.IParams = {},
  seed?: number | string,
): Archetype<createCrowdBarrier.Affordance, createObstacle.Dimension> {
  const { builder, d }: ObstacleDraw.IObstacle<createCrowdBarrier.Affordance> =
    ObstacleDraw.begin("crowdBarrier", "crowd barrier", "steel", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const length: number = d.length!;
  const height: number = d.height!;
  const r: number = d.tube! / 2;
  const z: number = createCrowdBarrier.ESTIMATES.foot / 2;
  const rail: number = height - r;
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const x: number = sign * (length / 2 - r);
    builder.rod(
      `foot-${side}`,
      r,
      v(x, r, 0),
      v(x, r, createCrowdBarrier.ESTIMATES.foot),
      {
        color: "#a7abb0",
      },
    );
    builder.rod(`post-${side}`, r, v(x, 2 * r, z), v(x, rail, z), {
      color: "#a7abb0",
    });
  }
  builder.rod(
    "rail-top",
    r,
    v(-length / 2 + r, rail, z),
    v(length / 2 - r, rail, z),
    {
      color: "#a7abb0",
    },
  );
  builder.rod(
    "rail-bottom",
    r,
    v(-length / 2 + r, createCrowdBarrier.ESTIMATES.bottomRail, z),
    v(length / 2 - r, createCrowdBarrier.ESTIMATES.bottomRail, z),
    { color: "#a7abb0" },
  );
  const span: number = length - 2 * d.tube!;
  const count: number = Math.floor(span / d.spacing!) - 1;
  for (let k: number = 1; k <= count; k++) {
    const x: number = -span / 2 + (span * k) / (count + 1);
    builder.rod(
      `picket-${k}`,
      createCrowdBarrier.ESTIMATES.picket / 2,
      v(x, createCrowdBarrier.ESTIMATES.bottomRail, z),
      v(x, rail, z),
      {
        color: "#a7abb0",
      },
    );
  }
  builder.affordance({
    id: "rail",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, rail, z), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    grip: "power",
    aperture: d.tube!,
    length: length - 2 * d.tube!,
  });
  return builder.build(d.mass!);
}

/**
 * Inputs, dimensions and contacts for {@link createCrowdBarrier}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createCrowdBarrier {
  /** The named contacts built by this producer. */
  export type Affordance = "rail";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "length" | "height" | "tube" | "spacing" | "mass";

  /** The numeric overrides and optional scene identifier. */
  export type IParams = Partial<Record<Dimension, number>> & {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  };

  /** The estimated feet, bottom-rail height and picket diameter, metres. */
  export const ESTIMATES: Readonly<{
    foot: number;
    bottomRail: number;
    picket: number;
  }> = {
    foot: 0.6,
    bottomRail: 0.15,
    picket: 0.016,
  };
}
