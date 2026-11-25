import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { ObstacleDraw } from "./ObstacleDraw";

/**
 * A steel crowd barrier with feet, pickets and an accessible upper rail.
 *
 * The frame's drawn height, tube size and picket spacing place a grip on its
 * real upper rail. The object stands on Y = 0 and is approached from +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createCrowdBarrier(
  params: createCrowdBarrier.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createCrowdBarrier.Affordance,
  createCrowdBarrier.Dimension
> {
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
    frame: AutoMovieArchetypeFrame.facing(
      v(0, rail, z),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.tube!,
    length: length - 2 * d.tube!,
  });
  return builder.build(d.mass!);
}

/** Inputs, dimensions and contacts for {@link createCrowdBarrier}. */
export namespace createCrowdBarrier {
  /** The named contacts built by this producer. */
  export type Affordance = "rail";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "height" | "length" | "mass" | "spacing" | "tube";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }

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
