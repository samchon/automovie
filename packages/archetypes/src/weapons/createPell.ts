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
 * A pell: the upright post a swordsman strikes in solo drill.
 *
 * The post stands on the ground at the origin. `target` is its `+Z` side, the
 * face a drill's cuts and thrusts are aimed at, as wide as the post and as
 * high; a site on it names a height, so a cut to the head and a cut to the leg
 * are two sites of one contact. `top` is the post's upper end.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The pell.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createPell(
  params: createPell.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createPell.Affordance, createPell.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createPell.Dimension> =
    new AutoMovieArchetypeDrawSession<createPell.Dimension>(
      "pell",
      createPell.UNITS,
      seed,
      params,
    );
  const d: Record<createPell.Dimension, number> = draw.dimensions(
    createPell.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createPell.Affordance,
    createPell.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "pell",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.rod("post", d.diameter / 2, v(0, 0, 0), v(0, d.height, 0), {
    color: "#a9825a",
  });
  builder.affordance({
    id: "target",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height / 2, d.diameter / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.diameter,
    depth: d.height,
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

/** Companion types and bands of {@link createPell}. */
export namespace createPell {
  /**
   * The affordance ids:
   *
   * - `target`: the post's `+Z` side, facing the striker; its width is the post's
   *   thickness and its depth the post's height.
   * - `top`: the upper end, facing up.
   */
  export type Affordance = "target" | "top";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the post above the ground.
   * - `diameter`: the post's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `pell` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      1.83,
      1.83,
      "a post standing six feet above the ground, Vegetius, De Re Militari I.11, recalled and not read at a source",
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      0.15,
      0.25,
      "a post about as thick as a man's trunk is wide, not read at a source",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      23,
      63,
      "an oak post of these sizes at about 700 kg per cubic metre, not read at a source",
      true,
    ),
  };
}
