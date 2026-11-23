import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../core";
import { ObstacleDraw } from "./ObstacleDraw";
import type { createObstacle } from "./createObstacle";

/**
 * A timber railway crosstie with its upper face and forward edge available to a
 * stepping act.
 *
 * The chosen section fixes the rise and depth and the chosen tie length fixes
 * the X span. The object stands on Y = 0 and is approached from +Z.
 *
 * @param params The scene identifier, optional section and length choices, and
 *   free mass.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createCrosstie(
  params: createCrosstie.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createCrosstie.Affordance, createCrosstie.Dimension> {
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

/** Inputs, dimensions and contacts for {@link createCrosstie}. */
export namespace createCrosstie {
  /** The named contacts built by this producer. */
  export type Affordance = "edge" | "top";

  /** The dimensions an author may fix, in the same units. */
  export type Fixed = "mass";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height" | "length" | "mass" | "width";

  /**
   * The numeric overrides and optional scene identifier. Its section and length
   * each select a complete measured profile.
   */
  export interface IParams extends Partial<Record<Fixed, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;

    /** The measured section, drawn from the seed when omitted. */
    section?: createObstacle.Section;

    /** The measured length, drawn from the seed when omitted. */
    tieLength?: createObstacle.TieLength;
  }
}
