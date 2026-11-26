import type { AutoMovieArchetypeCrosstie } from "../AutoMovieArchetypeCrosstie";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../../core/index";
import { ObstacleDraw } from "../ObstacleDraw";


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
  params: AutoMovieArchetypeCrosstie.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCrosstie.Affordance, AutoMovieArchetypeCrosstie.Dimension> {
  const { builder, d }: ObstacleDraw.IObstacle<AutoMovieArchetypeCrosstie.Affordance> =
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
