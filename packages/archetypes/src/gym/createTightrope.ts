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
 * A tightrope or slackline: a wire stretched level between two anchor posts.
 *
 * It stands on the floor with the middle of its span at the origin, the wire
 * along `X`. `bar` is the wire's middle, on its axis, `+Y` up: a walker stands
 * on it anywhere along its length (`lineWalk`, which also takes the sag its
 * load gives it).
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The rope.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createTightrope(
  params: createTightrope.IParams = {},
  seed?: number,
): AutoMovieArchetype<createTightrope.Affordance, createTightrope.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createTightrope.Dimension> =
    new AutoMovieArchetypeDrawSession<createTightrope.Dimension>(
      "tightrope",
      createTightrope.UNITS,
      seed,
      params,
    );
  const d: Record<createTightrope.Dimension, number> = draw.dimensions(
    createTightrope.BANDS,
  );
  const half: number = d.span / 2;
  const height: number = d.height;
  const builder: AutoMovieArchetypeBuilder<
    createTightrope.Affordance,
    createTightrope.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "tightrope",
    draw,
  });
  builder.rod(
    "wire",
    d.diameter / 2,
    Vector3.create(-half, height, 0),
    Vector3.create(half, height, 0),
    { color: "#c8c3b8" },
  );
  for (const side of [1, -1] as const)
    builder.rod(
      side === 1 ? "post-left" : "post-right",
      createTightrope.POST,
      Vector3.create(side * (half + createTightrope.POST), 0, 0),
      Vector3.create(side * (half + createTightrope.POST), height + 0.1, 0),
      { color: "#6b5a46" },
    );
  builder.affordance({
    id: "bar",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: null,
    length: d.span,
    aperture: d.diameter,
  });
  return builder.build(d.mass);
}

/** Companion types and bands of {@link createTightrope}. */
export namespace createTightrope {
  /** A post's radius, metres. An estimate, not read at a source. */
  export const POST: number = 0.06;

  /**
   * The affordance ids: `bar`, the wire's middle on its axis, `+Y` up, stood on
   * from above.
   */
  export type Affordance = "bar";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the wire above the floor.
   * - `span`: between the anchors.
   * - `diameter`: the wire's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "span" | "diameter" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    span: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `tightrope` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      0.3,
      3,
      "an estimate: from a park slackline to a circus low wire; no rigging sheet was read",
      true,
    ),
    span: AutoMovieArchetypeBand.metres(
      3,
      30,
      "an estimate: a training wire to a long slackline; no rigging sheet was read",
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      0.012,
      0.025,
      "an estimate: a walking cable's thickness, or a flat line's width; no rigging sheet was read",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      20,
      200,
      "an estimate, posts included",
      true,
    ),
  };
}
