import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeUnits } from "../core";
import { ObstacleDraw } from "./ObstacleDraw";

/**
 * A concrete road barrier with its base, upper face and front edge retained for
 * crossing checks.
 *
 * The documented section fixes the high top and projected footprint. The
 * barrier keeps the three-box approximation of the original sloped section. The
 * object stands on Y = 0 and is approached from +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createJerseyBarrier(
  params: createJerseyBarrier.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createJerseyBarrier.Affordance,
  createJerseyBarrier.Dimension
> {
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
      Math.tan(createJerseyBarrier.LOWER_FACE * AutoMovieArchetypeUnits.DEGREE);
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

/** Inputs, dimensions and contacts for {@link createJerseyBarrier}. */
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
