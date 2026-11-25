import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** What the figures come from. */
const FIG: string =
  "FIG Apparatus Norms (2022), vault springboard: 1.20 m long, 0.60 m wide, its front edge 0.20 m high (https://www.gymnastics.sport/site/pages/education-apparatus.php)";

/**
 * A vault's springboard: a board the gymnast lands on with both feet out of the
 * run-up hurdle and takes off from toward the vaulting table.
 *
 * The run goes along `+Z`; the board lies centred on the origin along `Z`.
 * `surface` is its top, `+Y` up, drawn level at the board's height (a first
 * pass: the real board rises toward its front edge).
 *
 * @param params Any figure the author fixes.
 * @param seed The seed that draws each figure left free inside its band;
 *   absent, the middle of each band.
 * @returns The springboard.
 * @throws {AutoMovieArchetypeRefusal} For a fixed figure outside its band.
 */
export function createSpringboard(
  params: createSpringboard.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createSpringboard.Affordance,
  createSpringboard.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createSpringboard.Dimension> =
    new AutoMovieArchetypeDrawSession<createSpringboard.Dimension>(
      "springboard",
      createSpringboard.UNITS,
      seed,
      params,
    );
  const d: Record<createSpringboard.Dimension, number> = draw.dimensions(
    createSpringboard.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createSpringboard.Affordance,
    createSpringboard.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "springboard",
    draw,
  });
  builder.box(
    "board",
    Vector3.create(d.width, d.height, d.length),
    Vector3.create(0, d.height / 2, 0),
    { color: "#c9b48a" },
  );
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, d.height, 0)),
    extent: null,
    width: d.width,
    depth: d.length,
  });
  return builder.build(d.mass);
}

/** Companion types and bands of {@link createSpringboard}. */
export namespace createSpringboard {
  /** The affordance ids: `surface`, the board's top. */
  export type Affordance = "surface";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: along `Z`, the run's direction.
   * - `width`: along `X`.
   * - `height`: the top above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "height" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    height: "m",
    mass: "kg",
  };

  /** The parameters: any figure fixed inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `springboard` when absent. */
    id?: string;
  }

  /** The band of each figure. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(1.2, 1.2, FIG),
    width: AutoMovieArchetypeBand.metres(0.6, 0.6, FIG),
    height: AutoMovieArchetypeBand.metres(0.2, 0.2, FIG),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      15,
      25,
      "an estimate of a wooden board with springs",
      true,
    ),
  };
}
