import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
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
 * A boxing or kickboxing ring: a square raised platform with a corner post at each corner and ropes along its four sides.
 *
 * The platform stands on the floor centred over the origin, its square along `X` and `Z`. `canvas` is the floor inside the ropes; each side's top rope (`northRope` along `+Z`'s side, `southRope`, `eastRope` along `+X`'s, `westRope`) is a bar a fighter leans on or a hand takes, its `+Y` toward the ring's middle; `corner<n>` is the top of each post, counted round from `+X +Z`.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The ring.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the ring stands and its contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A platform box of the drawn height whose square is the drawn inside size and an apron; a post rod at each corner of the inside square rising to the top rope; four ropes on each side at the guide's heights, scaled to the drawn top rope's height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the platform, the posts, the ropes, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ropes are straight rigid rods, not slack; no turnbuckles, pads or steps; the apron's width and the parts' sizes are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms One platform, four posts and four ropes per level.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createRing(
  params: createRing.IParams = {},
  seed?: number | string,
): Archetype<createRing.Affordance, createRing.Dimension> {
  const d: Record<createRing.Dimension, number> = ArchetypeDraw.dimensions(
    "ring",
    createRing.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<createRing.Affordance, createRing.Dimension> =
    new ArchetypeBuilder({
      archetype: "ring",
      id: params.id,
      name: "ring",
      dimensions: d,
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
      frame: ArchetypeFrame.upright(v(x, top, z)),
      extent: null,
    });
  }
  const rope: number = createRing.ROPE;
  const levels: number = createRing.ROPES;
  for (let level: number = 1; level <= levels; level++) {
    const y: number =
      floor + (d.topRope * createRing.LEVELS[level - 1]!) / createRing.LEVELS[levels - 1]!;
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
      frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.upright(v(0, floor, 0)),
    extent: null,
    width: d.size,
    depth: d.size,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createRing}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension the guide sets: the inside square, the platform's height and the top rope's height above the canvas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canvas fighters stand on, the top ropes and the corners a bout reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sizes are the AIBA guide's as read; it states no mass, so the mass band is provisional; the posts' section is a named estimate.
 */
export namespace createRing {
  /** The apron beyond the ropes on each side, metres: the AIBA guide's 85 cm. */
  export const APRON: number = 0.85;

  /** The posts' diameter, metres: an estimate. */
  export const POST: number = 0.1;

  /** The ropes' thickness, metres: the AIBA guide's 4 cm, without the cover. */
  export const ROPE: number = 0.04;

  /** The ropes on each side: the AIBA guide's four. */
  export const ROPES: number = 4;

  /** The ropes' heights above the canvas, metres: the AIBA guide's 40, 70, 100 and 130 cm, scaled with the drawn top rope. */
  export const LEVELS: readonly number[] = [0.4, 0.7, 1, 1.3];

  /**
   * The affordance ids:
   *
   * - `canvas`: the floor inside the ropes, facing up.
   * - `northRope`, `southRope`, `eastRope`, `westRope`: each side's top rope, a bar, `+Y` toward the middle.
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

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `ring` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    size: ArchetypeBand.metres(
      6.1,
      6.1,
      `${AIBA}, canvas: 6.10 m square inside the line of the ropes`,
    ),
    platform: ArchetypeBand.metres(
      1,
      1,
      `${AIBA}, poles: 230 cm in all and 130 cm above the canvas, so the canvas stands 100 cm high`,
    ),
    topRope: ArchetypeBand.metres(
      1.3,
      1.3,
      `${AIBA}, ropes: the four at 40, 70, 100 and 130 cm from the canvas`,
    ),
    mass: ArchetypeBand.of(
      "kg",
      800,
      2000,
      "the AIBA guide states no mass; an estimate",
      true,
    ),
  };
}