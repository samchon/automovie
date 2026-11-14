import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The pistol's maker's data, read, which gives its magazine's mass and a full load's. */
const GLOCK: string =
  "GLOCK G17 Gen5 technical data: 630 g without magazine, 708 g with an empty and 945 g with a loaded 17-round magazine (https://eu.glock.com/en/products/pistols/g17-gen5)";

/** An aftermarket magazine for that pistol, read at a retailer. */
const STRIKE: string =
  "Strike Industries SI-G-MAG-17, 17 rounds: 125.55 mm long, 28.50 mm wide, 41.88 mm high, 1.4 oz (https://www.at3tactical.com/products/strike-industries-9mm-translucent-magazine-for-glock-17-17-round)";

/** The rifle magazine's maker and a retailer's table, read. */
const PMAG: string =
  "Magpul PMAG 30 AR/M4 GEN M3, 7.5 in long and 5 oz (https://magpul.com/firearm-accessories/pmag-30-ar-m4-gen-m3.html); T.REX Arms' table, 7.5 by 2.6 by 0.87 in, 146 g unloaded and 503 g loaded (https://www.trex-arms.com/store/magpul-ar-m4-pmag-336599)";

/**
 * A detachable box magazine: a pistol's or a rifle's.
 *
 * It stands on its base plate at the origin, its feed lips up along `+Y` and its front, where the rounds' noses point, toward `+Z`. `feed` is the top, facing up, the end that leads into the gun's magazine well. `base` is the base plate's underside, facing down: the palm strikes it to seat the magazine, and the magazine is seated when its `base` coincides with the gun's `magazine` socket, the well's mouth facing down out of the grip (`createHandgun`), so the body stands up inside the well. `grip` is the body a hand closes round, taken from the `-X` side. A rifle's magazine is drawn straight; its curve is not modelled.
 *
 * @param params The kind, whether it is loaded and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The magazine.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the magazine stands, how it seats in a well, and its three contacts.
 * @evidence contracts/development/implementation.md#principled-implementation One box of the published length, width and depth; a loaded magazine adds the published difference between the loaded and the empty weight, the rounds' mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one part, three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The base plate's lip, the feed lips and a rifle magazine's curve are not modelled; no contact needs them.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createMagazine(
  params: createMagazine.IParams,
  seed?: number | string,
): Archetype<createMagazine.Affordance, createMagazine.Dimension> {
  const kind: createMagazine.Kind = ArchetypeDraw.choice(
    "magazine",
    "kind",
    params.kind,
    createMagazine.KINDS,
  );
  const d: Record<createMagazine.Dimension, number> = ArchetypeDraw.dimensions(
    "magazine",
    createMagazine.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createMagazine.Affordance,
    createMagazine.Dimension
  > = new ArchetypeBuilder({
    archetype: "magazine",
    id: params.id,
    name: `${kind} magazine`,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.box(
    "body",
    v(d.width, d.length, d.depth),
    v(0, d.length / 2, 0),
    { color: "#2c2f33" },
  );
  builder.affordance({
    id: "feed",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0, d.length, 0)),
    extent: null,
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      v(0, d.length / 2, 0),
      v(-1, 0, 0),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.width,
    length: d.length,
  });
  builder.affordance({
    id: "base",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
    width: d.width,
    depth: d.depth,
  });
  return builder.build(
    d.mass + (params.loaded === true ? createMagazine.ROUNDS[kind] : 0),
  );
}

/**
 * Companion types, constants and bands of {@link createMagazine}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two magazines and one cited band per dimension each; loading is a parameter that adds a published mass, as on `createHandgun`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The end that seats in the well, the body a hand takes and the plate a palm strikes, which a reload reads (#3483, `reloadFirearm`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Its own producer, not a projectile kind: it holds rounds, it is not launched. Every band is a maker's or a retailer's published figure.
 */
export namespace createMagazine {
  /** The kinds: a pistol's double-stack magazine and a rifle's 30-round magazine. */
  export type Kind = "pistol" | "rifle";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["pistol", "rifle"];

  /** What a full magazine's rounds add, kilograms: the G17 Gen5's 945 less 708 g, and the PMAG 30's 503 less 146 g. */
  export const ROUNDS: Readonly<Record<Kind, number>> = {
    pistol: 0.237,
    rifle: 0.357,
  };

  /**
   * The affordance ids:
   *
   * - `feed`: the top, facing up, which leads into the well.
   * - `grip`: the body, taken from `-X`.
   * - `base`: the base plate's underside, facing down; coincident with the gun's `magazine` socket when seated.
   */
  export type Affordance = "feed" | "grip" | "base";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: base plate to feed lips, along `Y`.
   * - `width`: across, along `X`.
   * - `depth`: front to back, along `Z`.
   * - `mass`: empty, kilograms.
   */
  export type Dimension = "length" | "width" | "depth" | "mass";

  /** The parameters: the kind, whether it is loaded, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which magazine. */
    kind: Kind;

    /** Whether it is full, which adds its rounds' published mass; empty when absent. */
    loaded?: boolean;

    /** The model's id, unique in a scene; `magazine` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    pistol: {
      length: ArchetypeBand.metres(0.12555, 0.12555, STRIKE),
      width: ArchetypeBand.metres(0.0285, 0.0285, STRIKE),
      depth: ArchetypeBand.metres(
        0.04188,
        0.04188,
        `${STRIKE}; its 41.88 mm height is taken as front to back, the other two being the length and the double stack's width`,
      ),
      mass: ArchetypeBand.of(
        "kg",
        1.4 * 0.02835,
        0.078,
        `${STRIKE}; ${GLOCK}, the maker's own magazine 708 less 630 g`,
      ),
    },
    rifle: {
      length: ArchetypeBand.metres(7.5 * 0.0254, 7.5 * 0.0254, PMAG),
      width: ArchetypeBand.metres(0.87 * 0.0254, 0.87 * 0.0254, PMAG),
      depth: ArchetypeBand.metres(2.6 * 0.0254, 2.6 * 0.0254, PMAG),
      mass: ArchetypeBand.of("kg", 5 * 0.02835, 0.146, PMAG),
    },
  };
}
