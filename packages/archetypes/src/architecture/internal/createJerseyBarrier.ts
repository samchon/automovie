import { AutoMovieArchetypeJerseyBarrier } from "../AutoMovieArchetypeJerseyBarrier";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeUnits } from "../../core/index";
import { ObstacleDraw } from "../ObstacleDraw";

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
  params: AutoMovieArchetypeJerseyBarrier.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeJerseyBarrier.Affordance,
  AutoMovieArchetypeJerseyBarrier.Dimension
> {
  const { builder, d }: ObstacleDraw.IObstacle<AutoMovieArchetypeJerseyBarrier.Affordance> =
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
      Math.tan(AutoMovieArchetypeJerseyBarrier.LOWER_FACE * AutoMovieArchetypeUnits.DEGREE);
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
