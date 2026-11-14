import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** What a maker's vessel reads as, not read at a source. */
const MAKER: string = "a common maker's size, not read at a source";

/**
 * An open vessel that holds food or ash: a bowl, an ashtray, a saucepan or a stockpot.
 *
 * It stands on its base centred over the origin, open upward, a saucepan's long handle out along `+X` and a stockpot's two side handles along `X`. `rim` is the top of the rim, facing up, as wide as the vessel; `inside` the floor inside, facing up, where a spoon stirs, a cigarette is stubbed or food lies; a bowl and an ashtray are held by `body`, from beneath; a saucepan by its `handle`, a stockpot by `leftHandle` and `rightHandle`.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The vessel.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the vessel stands, its open side, and which contact each kind declares.
 * @evidence contracts/development/implementation.md#principled-implementation A floor disc and four wall boxes round it to the drawn height and diameter, then the kind's handles: one rod out along `+X`, or two loops on either side.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the floor and the walls, the rim and the inside, then the kind's hold.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The walls are four flat boxes round a disc, not a turned shell; the wall's thickness and the handles' sizes are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most seven parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createVessel(
  params: createVessel.IParams,
  seed?: number | string,
): Archetype<createVessel.Affordance, createVessel.Dimension> {
  const kind: createVessel.Kind = ArchetypeDraw.choice(
    "vessel",
    "kind",
    params.kind,
    createVessel.KINDS,
  );
  const d: Record<createVessel.Dimension, number> = ArchetypeDraw.dimensions(
    "vessel",
    createVessel.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createVessel.Affordance,
    createVessel.Dimension
  > = new ArchetypeBuilder({
    archetype: "vessel",
    id: params.id,
    name: kind,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const wall: number = createVessel.WALL;
  const r: number = d.diameter / 2;
  const color: string = createVessel.COLORS[kind];
  builder.rod("floor", r, v(0, 0, 0), v(0, wall, 0), { color });
  for (const [id, size, at] of [
    [
      "wallFront",
      v(d.diameter, d.height - wall, wall),
      v(0, (d.height + wall) / 2, r - wall / 2),
    ],
    [
      "wallBack",
      v(d.diameter, d.height - wall, wall),
      v(0, (d.height + wall) / 2, -r + wall / 2),
    ],
    [
      "wallLeft",
      v(wall, d.height - wall, d.diameter - 2 * wall),
      v(r - wall / 2, (d.height + wall) / 2, 0),
    ],
    [
      "wallRight",
      v(wall, d.height - wall, d.diameter - 2 * wall),
      v(-r + wall / 2, (d.height + wall) / 2, 0),
    ],
  ] as const)
    builder.box(id, size, at, { color });
  builder.affordance({
    id: "rim",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
    width: d.diameter,
    depth: d.diameter,
  });
  builder.affordance({
    id: "inside",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, wall, 0)),
    extent: null,
    width: d.diameter - 2 * wall,
    depth: d.diameter - 2 * wall,
  });
  const grip: number = createVessel.GRIP;
  if (kind === "saucepan") {
    const length: number = createVessel.HANDLE;
    builder.rod(
      "handle",
      grip / 2,
      v(r, d.height - grip, 0),
      v(r + length, d.height - grip, 0),
      {
        color: "#2c2f33",
      },
    );
    builder.affordance({
      id: "handle",
      kind: "handle",
      frame: ArchetypeFrame.facing(
        v(r + length / 2, d.height - grip, 0),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: grip,
      length,
    });
  } else if (kind === "stockpot") {
    for (const [id, sign] of [
      ["leftHandle", 1],
      ["rightHandle", -1],
    ] as const) {
      const x: number = sign * (r + 0.03);
      builder.rod(
        id,
        grip / 2,
        v(x, d.height - grip, -0.05),
        v(x, d.height - grip, 0.05),
        {
          color: "#2c2f33",
        },
      );
      builder.affordance({
        id,
        kind: "handle",
        frame: ArchetypeFrame.facing(
          v(x, d.height - grip, 0),
          v(0, 1, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "hook",
        aperture: grip,
        length: 0.1,
      });
    }
  } else
    builder.affordance({
      id: "body",
      kind: "handle",
      frame: ArchetypeFrame.facing(v(0, wall / 2, 0), v(0, -1, 0), v(1, 0, 0)),
      extent: null,
      grip: kind === "bowl" ? "two-hand" : "precision",
      aperture: wall,
    });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createVessel}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the four vessels and one band per dimension each.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rim, the inside and the hold each vessel is used by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source was read, so every band is provisional; the wall's and the handles' sizes are named estimates.
 */
export namespace createVessel {
  /** The kinds. */
  export type Kind = "bowl" | "ashtray" | "saucepan" | "stockpot";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "bowl",
    "ashtray",
    "saucepan",
    "stockpot",
  ];

  /** The wall's and the floor's thickness, metres: an estimate. */
  export const WALL: number = 0.005;

  /** A handle's diameter, metres: an estimate. */
  export const GRIP: number = 0.025;

  /** A saucepan handle's length, metres: an estimate. */
  export const HANDLE: number = 0.18;

  /** Each kind's flat colour, sRGB. */
  export const COLORS: Readonly<Record<Kind, string>> = {
    bowl: "#f2efe8",
    ashtray: "#8fa3ad",
    saucepan: "#b9bcc0",
    stockpot: "#b9bcc0",
  };

  /**
   * The affordance ids:
   *
   * - `rim`: the rim's top, facing up.
   * - `inside`: the floor inside, facing up.
   * - `body`: a bowl or an ashtray held from beneath.
   * - `handle`: a saucepan's long handle along `+X`.
   * - `leftHandle`, `rightHandle`: a stockpot's two side handles at `+X` and `-X`.
   */
  export type Affordance =
    | "rim"
    | "inside"
    | "body"
    | "handle"
    | "leftHandle"
    | "rightHandle";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `diameter`: across the rim.
   * - `height`: the rim's top above the base.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which vessel. */
    kind: Kind;

    /** The model's id, unique in a scene; `vessel` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    bowl: {
      diameter: ArchetypeBand.metres(0.14, 0.18, MAKER, true),
      height: ArchetypeBand.metres(0.06, 0.08, MAKER, true),
      mass: ArchetypeBand.of("kg", 0.25, 0.45, MAKER, true),
    },
    ashtray: {
      diameter: ArchetypeBand.metres(0.1, 0.15, MAKER, true),
      height: ArchetypeBand.metres(0.03, 0.045, MAKER, true),
      mass: ArchetypeBand.of("kg", 0.2, 0.6, MAKER, true),
    },
    saucepan: {
      diameter: ArchetypeBand.metres(0.16, 0.2, MAKER, true),
      height: ArchetypeBand.metres(0.08, 0.11, MAKER, true),
      mass: ArchetypeBand.of("kg", 0.8, 1.4, MAKER, true),
    },
    stockpot: {
      diameter: ArchetypeBand.metres(0.24, 0.3, MAKER, true),
      height: ArchetypeBand.metres(0.2, 0.28, MAKER, true),
      mass: ArchetypeBand.of("kg", 1.8, 3, MAKER, true),
    },
  };
}
