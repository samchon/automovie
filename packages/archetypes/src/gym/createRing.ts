import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The amateur boxing body's ring guide, read. */
const AIBA: string =
  "AIBA Ring Manufacturer Guide, 12 February 2014 (https://www.iba.sport/wp-content/uploads/2019/02/AIBA_RING_MANUFACTURER_GUIDE_12.02.2014.pdf)";

/** The sides of the square, as the ring's own `+Z`, `-Z`, `+X` and `-X`. */
const SIDES: readonly ["north", "south", "east", "west"] = [
  "north",
  "south",
  "east",
  "west",
];

/**
 * A boxing or kickboxing ring: a square raised platform with a corner post at
 * each corner and ropes along its four sides.
 *
 * The platform stands on the floor centred over the origin, its square along
 * `X` and `Z`. `canvas` is the floor inside the ropes; each side's top rope
 * (`northRope` along `+Z`'s side, `southRope`, `eastRope` along `+X`'s,
 * `westRope`) is a bar a fighter leans on or a hand takes, its `+Y` toward the
 * ring's middle; `corner<n>` is the top of each post, counted round from `+X
 * +Z`.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The ring.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createRing(
  params: createRing.IParams = {},
  seed?: number,
): AutoMovieArchetype<createRing.Affordance, createRing.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createRing.Dimension> =
    new AutoMovieArchetypeDrawSession<createRing.Dimension>(
      "ring",
      createRing.UNITS,
      seed,
      params,
    );
  const d: Record<createRing.Dimension, number> = draw.dimensions(
    createRing.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createRing.Affordance,
    createRing.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "ring",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const half: number = d.size / 2;
  const outer: number = d.size + 2 * createRing.APRON;
  const floor: number = d.platform;
  builder.box("platform", v(outer, floor, outer), v(0, floor / 2, 0), {
    color: "#3a3d42",
  });
  const top: number = floor + d.topRope;
  for (const [id, x, z] of [
    ["corner1", half, half],
    ["corner2", -half, half],
    ["corner3", -half, -half],
    ["corner4", half, -half],
  ] as const) {
    builder.rod(
      `${id}Post`,
      createRing.POST / 2,
      v(x, floor, z),
      v(x, top, z),
      {
        color: "#c9ccd1",
      },
    );
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(x, top, z)),
      extent: null,
    });
  }
  const rope: number = createRing.ROPE;
  const levels: number = createRing.ROPES;
  for (let level: number = 1; level <= levels; level++) {
    const y: number =
      floor +
      (d.topRope * createRing.LEVELS[level - 1]!) /
        createRing.LEVELS[levels - 1]!;
    for (const side of SIDES) {
      const along: boolean = side === "north" || side === "south";
      const sign: number = side === "north" || side === "east" ? 1 : -1;
      const from: IAutoMovieVector3 = along
        ? v(-half, y, sign * half)
        : v(sign * half, y, -half);
      const to: IAutoMovieVector3 = along
        ? v(half, y, sign * half)
        : v(sign * half, y, half);
      builder.rod(`${side}Rope${level}`, rope / 2, from, to, {
        color: "#b22222",
      });
    }
  }
  for (const [side, id] of [
    ["north", "northRope"],
    ["south", "southRope"],
    ["east", "eastRope"],
    ["west", "westRope"],
  ] as const) {
    const along: boolean = side === "north" || side === "south";
    const sign: number = side === "north" || side === "east" ? 1 : -1;
    const at: IAutoMovieVector3 = along
      ? v(0, top, sign * half)
      : v(sign * half, top, 0);
    builder.affordance({
      id,
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        at,
        along ? v(0, 0, -sign) : v(-sign, 0, 0),
        along ? v(1, 0, 0) : v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: rope,
      length: d.size,
    });
  }
  builder.affordance({
    id: "canvas",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, floor, 0)),
    extent: null,
    width: d.size,
    depth: d.size,
  });
  return builder.build(d.mass);
}

/** Companion types, constants and bands of {@link createRing}. */
export namespace createRing {
  /** The apron beyond the ropes on each side, metres: the AIBA guide's 85 cm. */
  export const APRON: number = 0.85;

  /** The posts' diameter, metres: an estimate. */
  export const POST: number = 0.1;

  /** The ropes' thickness, metres: the AIBA guide's 4 cm, without the cover. */
  export const ROPE: number = 0.04;

  /** The ropes on each side: the AIBA guide's four. */
  export const ROPES: number = 4;

  /**
   * The ropes' heights above the canvas, metres: the AIBA guide's 40, 70, 100
   * and 130 cm, scaled with the drawn top rope.
   */
  export const LEVELS: readonly number[] = [0.4, 0.7, 1, 1.3];

  /**
   * The affordance ids:
   *
   * - `canvas`: the floor inside the ropes, facing up.
   * - `northRope`, `southRope`, `eastRope`, `westRope`: each side's top rope, a
   *   bar, `+Y` toward the middle.
   * - `corner1` to `corner4`: the posts' tops, counted round from `+X +Z`.
   */
  export type Affordance =
    | "canvas"
    | "northRope"
    | "southRope"
    | "eastRope"
    | "westRope"
    | "corner1"
    | "corner2"
    | "corner3"
    | "corner4";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `size`: the square inside the ropes.
   * - `platform`: the canvas's height above the floor.
   * - `topRope`: the top rope above the canvas.
   * - `mass`: kilograms.
   */
  export type Dimension = "size" | "platform" | "topRope" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    size: "m",
    platform: "m",
    topRope: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `ring` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    size: AutoMovieArchetypeBand.metres(
      6.1,
      6.1,
      `${AIBA}, canvas: 6.10 m square inside the line of the ropes`,
    ),
    platform: AutoMovieArchetypeBand.metres(
      1,
      1,
      `${AIBA}, poles: 230 cm in all and 130 cm above the canvas, so the canvas stands 100 cm high`,
    ),
    topRope: AutoMovieArchetypeBand.metres(
      1.3,
      1.3,
      `${AIBA}, ropes: the four at 40, 70, 100 and 130 cm from the canvas`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      800,
      2000,
      "the AIBA guide states no mass; an estimate",
      true,
    ),
  };
}
