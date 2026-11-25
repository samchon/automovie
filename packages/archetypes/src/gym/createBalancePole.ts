import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/**
 * A wire walker's balancing pole: a long, heavy rod held across the body.
 *
 * Its middle is at the origin, the pole along `X`. `leftGrip` and `rightGrip`
 * lie `grip` apart about the middle, `+Y` up: the hands take them from above,
 * the left at `+X`.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The pole.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createBalancePole(
  params: createBalancePole.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createBalancePole.Affordance,
  createBalancePole.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createBalancePole.Dimension> =
    new AutoMovieArchetypeDrawSession<createBalancePole.Dimension>(
      "balancePole",
      createBalancePole.UNITS,
      seed,
      params,
    );
  const d: Record<createBalancePole.Dimension, number> = draw.dimensions(
    createBalancePole.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createBalancePole.Affordance,
    createBalancePole.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "balancing pole",
    draw,
  });
  builder.rod(
    "pole",
    d.diameter / 2,
    Vector3.create(-d.length / 2, 0, 0),
    Vector3.create(d.length / 2, 0, 0),
    { color: "#a07a4c" },
  );
  for (const side of ["left", "right"] as const)
    builder.affordance({
      id: side === "left" ? "leftGrip" : "rightGrip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.upright(
        Vector3.create(((side === "left" ? 1 : -1) * d.grip) / 2, 0, 0),
      ),
      extent: null,
      length: 0.12,
      aperture: d.diameter,
    });
  return builder.build(d.mass);
}

/** Companion types and bands of {@link createBalancePole}. */
export namespace createBalancePole {
  /** The affordance ids: `leftGrip` and `rightGrip`, `+Y` up, held from above. */
  export type Affordance = "leftGrip" | "rightGrip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: end to end.
   * - `diameter`: the rod's thickness.
   * - `grip`: between the two grips.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "grip" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    grip: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `balancePole` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(
      4,
      10,
      "an estimate: wire walkers' poles run from a few metres to about ten; no maker's sheet was read",
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      0.025,
      0.04,
      "an estimate; no maker's sheet was read",
      true,
    ),
    grip: AutoMovieArchetypeBand.metres(
      0.5,
      0.8,
      "an estimate: the hands about shoulder width or a little wider; no source was read",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      5,
      15,
      "an estimate; no maker's sheet was read",
      true,
    ),
  };
}
