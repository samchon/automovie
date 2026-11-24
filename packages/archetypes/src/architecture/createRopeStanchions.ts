import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { ObstacleDraw } from "./ObstacleDraw";

/**
 * Two freestanding stanchions with grip frames on their shafts and the rope
 * between them.
 *
 * The measured dimensions set the foot clearance and positions of the three bar
 * contacts. The rope stays straight as in the saved design. The object stands
 * on Y = 0 and is approached from +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createRopeStanchions(
  params: createRopeStanchions.IParams = {},
  seed?: number,
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

/** Inputs, dimensions and contacts for {@link createRopeStanchions}. */
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
