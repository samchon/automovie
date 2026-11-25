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
 * A walking stilt: a foot platform strapped under the foot on an upright pole
 * that ends in a rubber tip.
 *
 * It stands on its tip at the origin, the pole along `Y`. `foot` is the
 * platform's top at the pole's head, `+Y` up, `+Z` the toes' way: the sole
 * stands there. `tip` is the pole's foot on the floor.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The stilt.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createStilt(
  params: createStilt.IParams = {},
  seed?: number,
): AutoMovieArchetype<createStilt.Affordance, createStilt.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createStilt.Dimension> =
    new AutoMovieArchetypeDrawSession<createStilt.Dimension>(
      "stilt",
      createStilt.UNITS,
      seed,
      params,
    );
  const d: Record<createStilt.Dimension, number> = draw.dimensions(
    createStilt.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createStilt.Affordance,
    createStilt.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "stilt",
    draw,
  });
  builder.rod(
    "pole",
    createStilt.POLE,
    Vector3.create(0, 0, 0),
    Vector3.create(0, d.height - createStilt.PLATFORM, 0),
    { color: "#8a6a44" },
  );
  builder.box(
    "platform",
    Vector3.create(0.1, createStilt.PLATFORM, d.length),
    Vector3.create(0, d.height - createStilt.PLATFORM / 2, 0),
    { color: "#5b4a3a" },
  );
  builder.affordance({
    id: "foot",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, d.height, 0)),
    extent: null,
    width: 0.1,
    depth: d.length,
  });
  builder.affordance({
    id: "tip",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
    extent: null,
    width: 2 * createStilt.POLE,
    depth: 2 * createStilt.POLE,
  });
  return builder.build(d.mass);
}

/** Companion types and bands of {@link createStilt}. */
export namespace createStilt {
  /** The pole's radius, metres. An estimate, not read at a source. */
  export const POLE: number = 0.025;

  /** The platform's thickness, metres. An estimate. */
  export const PLATFORM: number = 0.03;

  /**
   * The affordance ids: `foot`, the platform's top; `tip`, the pole's foot on
   * the floor.
   */
  export type Affordance = "foot" | "tip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the platform's top above the tip.
   * - `length`: the platform's, heel to toe.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "length" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    length: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `stilt` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      0.3,
      1.2,
      "an estimate: from a child's peg stilt to a parade stilt; no maker's sheet was read",
      true,
    ),
    length: AutoMovieArchetypeBand.metres(
      0.22,
      0.3,
      "an estimate: a shoe's length",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      1,
      4,
      "an estimate; no maker's sheet was read",
      true,
    ),
  };
}
