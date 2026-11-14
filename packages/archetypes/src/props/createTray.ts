import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** IKEA's trays, read. */
const TRAYS: string =
  "IKEA serving trays: SMÖRLING 36 x 20 x 3 cm, GRILLTIDER 40 x 30 x 2 cm, SMULA 52 x 35 x 3 cm, GOKVÄLLÅ 56 x 37 cm (https://www.ikea.com/gb/en/p/smoerling-serving-tray-set-of-2-beech-10570660/, https://www.ikea.com/gb/en/p/grilltider-serving-tray-stainless-steel-40615153/, https://www.ikea.com/gb/en/p/smula-tray-transparent-40041131/, https://www.ikea.com/gb/en/p/gokvaella-serving-tray-gold-colour-70615651/)";

/** IKEA's handled baskets, read. */
const BASKETS: string =
  "IKEA RISATORP baskets with a wooden handle, 25 x 26 x 18 cm and 42 x 27 x 23 cm (https://www.ikea.com/au/en/p/risatorp-basket-white-60480544/, https://www.ikea.com/gb/en/p/risatorp-basket-white-20527633/)";

/** What no source read gives. */
const UNREAD: string = "the IKEA pages read give no weight of the item alone";

/**
 * A carrier things are set in and carried by hand: a serving tray or a basket.
 *
 * It stands on its floor centred over the origin, its long side along `X`. Its walls rise round the floor to the drawn height: a tray's a low rim, a basket's deep sides. `inside` is the floor inside, facing up, where things are set; a tray is carried by `leftHandle` and `rightHandle`, its two short ends' rims, taken from outside; a basket by `handle`, a bar arched over its middle along `Z`.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The carrier.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how it stands and where each kind is set into and carried.
 * @evidence contracts/development/implementation.md#principled-implementation A floor box and four wall boxes round it to the drawn height, and a basket's handle a rod across the top at a hand's clearance above the rim on two short posts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the floor, the walls, then the kind's hold.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The handle is a straight bar on two posts, not an arch; the wall's thickness and the handle's sizes are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most eight parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createTray(
  params: createTray.IParams,
  seed?: number | string,
): Archetype<createTray.Affordance, createTray.Dimension> {
  const kind: createTray.Kind = ArchetypeDraw.choice(
    "tray",
    "kind",
    params.kind,
    createTray.KINDS,
  );
  const d: Record<createTray.Dimension, number> = ArchetypeDraw.dimensions(
    "tray",
    createTray.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<createTray.Affordance, createTray.Dimension> =
    new ArchetypeBuilder({
      archetype: "tray",
      id: params.id,
      name: kind,
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;
  const wall: number = createTray.WALL;
  const color: string = kind === "tray" ? "#6b4a2f" : "#b08d57";
  const hx: number = d.width / 2;
  const hz: number = d.depth / 2;
  const up: number = (d.height + wall) / 2;
  const tall: number = d.height - wall;
  builder.box("floor", v(d.width, wall, d.depth), v(0, wall / 2, 0), { color });
  for (const [id, size, at] of [
    ["wallFront", v(d.width, tall, wall), v(0, up, hz - wall / 2)],
    ["wallBack", v(d.width, tall, wall), v(0, up, -hz + wall / 2)],
    ["wallLeft", v(wall, tall, d.depth - 2 * wall), v(hx - wall / 2, up, 0)],
    ["wallRight", v(wall, tall, d.depth - 2 * wall), v(-hx + wall / 2, up, 0)],
  ] as const)
    builder.box(id, size, at, { color });
  builder.affordance({
    id: "inside",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, wall, 0)),
    extent: null,
    width: d.width - 2 * wall,
    depth: d.depth - 2 * wall,
  });
  if (kind === "tray")
    for (const [id, sign] of [
      ["leftHandle", 1],
      ["rightHandle", -1],
    ] as const)
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "none",
        frame: ArchetypeFrame.facing(
          v(sign * (hx - wall / 2), up, 0),
          v(sign, 0, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "hook",
        aperture: wall,
        length: d.depth / 2,
      });
  else {
    const grip: number = createTray.GRIP;
    const bar: number = d.height + createTray.CLEARANCE;
    for (const [id, sign] of [
      ["frontPost", 1],
      ["backPost", -1],
    ] as const)
      builder.rod(
        id,
        grip / 2,
        v(0, d.height, sign * (hz - wall / 2)),
        v(0, bar, sign * (hz - wall / 2)),
        {
          color,
        },
      );
    builder.rod(
      "handle",
      grip / 2,
      v(0, bar, -hz + wall / 2),
      v(0, bar, hz - wall / 2),
      { color },
    );
    builder.affordance({
      id: "handle",
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, bar, 0), v(0, 1, 0), v(0, 0, 1)),
      extent: null,
      grip: "power",
      aperture: grip,
      length: d.depth - 2 * wall,
    });
  }
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createTray}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two carriers and one band per dimension each.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The floor things are set on and the holds it is carried by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sizes are the products' as read; their weights are not given, so the mass bands are provisional; the wall's and the handle's sizes are named estimates.
 */
export namespace createTray {
  /** The kinds. */
  export type Kind = "tray" | "basket";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["tray", "basket"];

  /** The floor's and the walls' thickness, metres: an estimate. */
  export const WALL: number = 0.012;

  /** A basket handle's diameter, metres: an estimate. */
  export const GRIP: number = 0.025;

  /** A basket handle's height above the rim, metres: a hand's clearance, an estimate. */
  export const CLEARANCE: number = 0.12;

  /**
   * The affordance ids:
   *
   * - `inside`: the floor inside, facing up.
   * - `leftHandle`, `rightHandle`: a tray's short end rims at `+X` and `-X`, taken from outside.
   * - `handle`: a basket's bar over its middle, along `Z`.
   */
  export type Affordance = "inside" | "leftHandle" | "rightHandle" | "handle";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: along `X`.
   * - `depth`: along `Z`.
   * - `height`: the walls' top above the base.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier. */
    kind: Kind;

    /** The model's id, unique in a scene; `tray` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    tray: {
      width: ArchetypeBand.metres(0.36, 0.56, TRAYS),
      depth: ArchetypeBand.metres(0.2, 0.37, TRAYS),
      height: ArchetypeBand.metres(0.02, 0.03, TRAYS),
      mass: ArchetypeBand.of("kg", 0.4, 1, UNREAD, true),
    },
    basket: {
      width: ArchetypeBand.metres(0.25, 0.42, BASKETS),
      depth: ArchetypeBand.metres(0.26, 0.27, BASKETS),
      height: ArchetypeBand.metres(0.18, 0.23, BASKETS),
      mass: ArchetypeBand.of("kg", 0.3, 0.8, UNREAD, true),
    },
  };
}