import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The norm that sizes a competition trampoline. */
const FIG: string =
  "Fédération Internationale de Gymnastique, Apparatus Norms, the trampoline: a frame 5.05 m by 2.91 m, its bed 4.28 m by 2.14 m, 1.155 m above the floor";

/** Constructs the trampoline archetype from its recipe. */
export namespace AutoMovieArchetypeTrampoline {
/**
 * A trampoline: a sprung bed laced inside a frame on legs.
 *
 * It stands on the floor with the middle of the bed over the origin, the bed's
 * length along `Z`. `bed` is the bed's middle at rest, `+Y` up: a jumper
 * bounces anywhere on it, the bed giving under load by the jumping law's
 * force-deflection relation.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The trampoline.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeTrampoline.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeTrampoline.Affordance, AutoMovieArchetypeTrampoline.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeTrampoline.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeTrampoline.Dimension>(
      "trampoline",
      AutoMovieArchetypeTrampoline.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeTrampoline.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeTrampoline.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeTrampoline.Affordance,
    AutoMovieArchetypeTrampoline.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "trampoline",
    draw,
  });
  const halfX: number = d.width / 2 + AutoMovieArchetypeTrampoline.MARGIN;
  const halfZ: number = d.length / 2 + AutoMovieArchetypeTrampoline.MARGIN;
  builder.box(
    "bed",
    Vector3.create(d.width, AutoMovieArchetypeTrampoline.BED, d.length),
    Vector3.create(0, d.height - AutoMovieArchetypeTrampoline.BED / 2, 0),
    { color: "#1d1d1f" },
  );
  for (const [name, from, to] of [
    [
      "rail-left",
      Vector3.create(halfX, d.height, -halfZ),
      Vector3.create(halfX, d.height, halfZ),
    ],
    [
      "rail-right",
      Vector3.create(-halfX, d.height, -halfZ),
      Vector3.create(-halfX, d.height, halfZ),
    ],
    [
      "rail-front",
      Vector3.create(-halfX, d.height, halfZ),
      Vector3.create(halfX, d.height, halfZ),
    ],
    [
      "rail-back",
      Vector3.create(-halfX, d.height, -halfZ),
      Vector3.create(halfX, d.height, -halfZ),
    ],
  ] as const)
    builder.rod(name, AutoMovieArchetypeTrampoline.RAIL, from, to, { color: "#3c6fb4" });
  for (const [name, x, z] of [
    ["leg-1", halfX, halfZ],
    ["leg-2", -halfX, halfZ],
    ["leg-3", halfX, -halfZ],
    ["leg-4", -halfX, -halfZ],
  ] as const)
    builder.rod(
      name,
      AutoMovieArchetypeTrampoline.RAIL,
      Vector3.create(x, 0, z),
      Vector3.create(x, d.height, z),
      { color: "#3c6fb4" },
    );
  builder.affordance({
    id: "bed",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, d.height, 0)),
    extent: null,
    width: d.width,
    depth: d.length,
  });
  return builder.build(d.mass);
}

  /** The bed's drawn thickness, metres. */
  export const BED: number = 0.01;

  /**
   * The frame's margin around the bed, where the springs run, metres (the
   * norm's frame less its bed, halved).
   */
  export const MARGIN: number = 0.385;

  /** A rail's and a leg's radius, metres. An estimate. */
  export const RAIL: number = 0.035;

  /** The affordance ids: `bed`, the bed's middle at rest, `+Y` up. */
  export type Affordance = "bed";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the bed above the floor.
   * - `width`: the bed's, across.
   * - `length`: the bed's, along.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "width" | "length" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    width: "m",
    length: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `trampoline` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      0.6,
      1.155,
      `${FIG}; a backyard bed stands lower (an estimate)`,
      true,
    ),
    width: AutoMovieArchetypeBand.metres(2.14, 2.14, FIG),
    length: AutoMovieArchetypeBand.metres(4.28, 4.28, FIG),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      80,
      150,
      "an estimate; the norm states no mass",
      true,
    ),
  };
}
