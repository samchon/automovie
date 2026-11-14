import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Taper candles, seen only in search results. */
const TAPER: string =
  "IKEA VINTERFINT and KLOKHET unscented taper candles, 25 to 26 cm long and 22 mm across, twenty KLOKHET packed at 1.29 kg, seen only in search results";

/** Candle holders, seen only in search results. */
const HOLDER: string =
  "IKEA FINSMAK candlestick 4 cm high and TJÄRLEK 7 cm high, and a Candlesmith brass chamberstick 3.25 in across, seen only in search results";

/** The maker's lantern, read, and its lighter listings seen only in search results. */
const LANTERN: string =
  "W.T. Kirkman Lanterns, Dietz #76 Original: 10 1/2 in high, a 4 3/4 in base, a #856 globe 3 3/8 in high and 2 1/2 in across at its top, 1.25 lb (https://lanternnet.com/?p=492); retailers' 1.08 to 1.17 lb seen only in search results";

/** Hand-held fire torches, seen only in search results. */
const TORCH: string =
  "fire-performance torches with a cloth wick, 16, 20 and 24 in long, and Henry's Spitfire Torch's 65 mm wick, seen only in search results";

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), applied to a torch's shaft, whose own diameter no maker states";

/** IKEA's lamps, read. */
const LAMPS: string =
  "IKEA FORSÅ work lamp, 35 cm high, base 15 cm, shade 12 cm (https://www.ikea.com/gb/en/p/forsa-work-lamp-nickel-plated-10146766/); TERTIAL work lamp, shade 17 cm (https://www.ikea.com/gb/en/p/tertial-work-lamp-dark-grey-40450802/); HEKTAR floor lamp, 176 cm high, base 30 cm, shade 16.0 cm (https://www.ikea.com/gb/en/p/hektar-floor-lamp-with-3-spot-dark-grey-60393603/); SKURUP pendant lamp, 15 in across, 11 in high, cord 4 ft 11 in (https://www.ikea.com/us/en/p/skurup-pendant-lamp-black-70407124/)";

/**
 * A light a person carries, hangs or switches: a taper candle in its holder, a hurricane lantern, a hand-held fire torch, a desk lamp, a floor lamp or a pendant lamp.
 *
 * Each but the pendant stands upright on the floor of its own space, `+Y` up. `grip` is where a hand holds it: the candle holder's socket, the lantern's bail over its top along `X`, the torch's shaft taken from `-Z`, a lamp's shade, taken from the side to aim it. `light` is where the light comes from, the frame a production places a light at: a flame's point with `+Y` up the flame, a lamp's shade mouth with `+Y` down along its beam; the light itself is the render's, not the archetype's. A lantern also declares `hook`, its bail's middle, to hang it by. A desk or floor lamp stands on a round base with a stem to its shade, and `switch` is a push button on the base's top at its `+Z` side. A pendant hangs from its `hook` at the origin, on the ceiling, its cord down to the shade.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The light.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each light stands, where it is held, where its flame is and that the light is the render's.
 * @evidence contracts/development/implementation.md#principled-implementation A candle as a dish, a socket and a taper stacked; a lantern as the Dietz's fount, globe and top stacked to its height, its two side tubes and its bail; a torch as a shaft and a wick head. Every grip's frame lies at the centre of the part it closes on, with that part's span along its `+Y` as the aperture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one branch per kind: its parts, its grip, its flame.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The flame is a frame, not a part; a lantern's guards and burner, a holder's drip pan rim and a torch's binding are not modelled; the dish's and socket's walls, the lantern's fount and top heights, the bail's rise and wire, the torch's head length and the flame's offset are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most eight parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLight(
  params: createLight.IParams,
  seed?: number | string,
): Archetype<createLight.Affordance, createLight.Dimension> {
  const kind: createLight.Kind = ArchetypeDraw.choice(
    "light",
    "kind",
    params.kind,
    createLight.KINDS,
  );
  const d: Partial<Record<createLight.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "light",
      createLight.BANDS[kind],
      seed,
      params,
      createLight.BANDS,
    );
  const builder: ArchetypeBuilder<
    createLight.Affordance,
    createLight.Dimension
  > = new ArchetypeBuilder({
    archetype: "light",
    id: params.id,
    name: kind === "fireTorch" ? "fire torch" : kind,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const flame: number = createLight.FLAME;

  if (kind === "deskLamp" || kind === "floorLamp" || kind === "pendant") {
    // A lamp: a shade whose mouth faces down, on a stem from a round base, or on a cord from the ceiling.
    const shade: number = d.shade! / 2;
    const pendant: boolean = kind === "pendant";
    const deep: number = pendant ? d.height! : createLight.SHADE;
    const mouth: number = pendant ? -d.cord! - deep : d.height! - deep;
    const metal: string = "#2c2f33";
    if (pendant)
      builder.rod("cord", createLight.CORD, v(0, 0, 0), v(0, mouth + deep, 0), {
        color: metal,
        density: 0.2,
      });
    else {
      const base: number = createLight.BASE;
      builder.rod("base", d.base! / 2, v(0, 0, 0), v(0, base, 0), {
        color: metal,
        density: 3,
      });
      builder.rod("stem", createLight.STEM, v(0, base, 0), v(0, mouth, 0), {
        color: metal,
      });
      builder.affordance({
        id: "switch",
        kind: "button",
        frame: ArchetypeFrame.upright(v(0, base, d.base! / 4)),
        extent: null,
        travel: createLight.PRESS,
      });
    }
    builder.rod("shade", shade, v(0, mouth, 0), v(0, mouth + deep, 0), {
      color: "#d9d4c7",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(0, mouth + deep / 2, 0),
        v(-1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: d.shade!,
    });
    builder.affordance({
      id: "light",
      kind: "socket",
      direction: "along",
      frame: ArchetypeFrame.facing(v(0, mouth, 0), v(0, -1, 0), v(1, 0, 0)),
      extent: null,
    });
    if (pendant)
      builder.affordance({
        id: "hook",
        kind: "hook",
        frame: ArchetypeFrame.upright(v(0, 0, 0)),
        extent: null,
      });
    return builder.build(d.mass!);
  }

  if (kind === "candle") {
    // The dish, the socket rising from it to the holder's height, and the taper standing on the socket.
    const dish: number = createLight.DISH;
    const holder: number = d.holder!;
    const taper: number = d.taper!;
    const socket: number = d.taperDiameter! / 2 + createLight.SOCKET_WALL;
    builder.rod("dish", d.dishDiameter! / 2, v(0, 0, 0), v(0, dish, 0), {
      color: "#b08d3c",
    });
    builder.rod("socket", socket, v(0, dish, 0), v(0, holder, 0), {
      color: "#b08d3c",
    });
    builder.rod(
      "taper",
      d.taperDiameter! / 2,
      v(0, holder, 0),
      v(0, holder + taper, 0),
      { color: "#f4efe1", density: 0.9 },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(0, (dish + holder) / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * socket,
      length: holder - dish,
    });
    builder.affordance({
      id: "light",
      kind: "socket",
      direction: "along",
      frame: ArchetypeFrame.upright(v(0, holder + taper + flame, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  if (kind === "lantern") {
    // The fount, the globe and the top stacked to the lantern's height, a side tube on each side, and the bail over the top along X.
    const height: number = d.height!;
    const base: number = d.base! / 2;
    const fount: number = createLight.FOUNT;
    const globe: number = createLight.GLOBE.height;
    const top: number = fount + globe;
    const wire: number = createLight.WIRE;
    const bail: number = height + createLight.BAIL_RISE;
    builder.rod("fount", base, v(0, 0, 0), v(0, fount, 0), {
      color: "#b33a2e",
      density: 1.5,
    });
    builder.rod(
      "globe",
      createLight.GLOBE.diameter / 2,
      v(0, fount, 0),
      v(0, top, 0),
      { color: "#d8e6ea", density: 0.8 },
    );
    builder.rod("top", base * 0.8, v(0, top, 0), v(0, height, 0), {
      color: "#b33a2e",
    });
    const side: number = base + createLight.TUBE;
    for (const [tube, ear, sign] of [
      ["tubeLeft", "earLeft", 1],
      ["tubeRight", "earRight", -1],
    ] as const) {
      builder.rod(
        tube,
        createLight.TUBE,
        v(sign * side, fount, 0),
        v(sign * side, height, 0),
        { color: "#b33a2e" },
      );
      builder.rod(ear, wire, v(sign * side, height, 0), v(sign * side, bail, 0), {
        color: "#2c2f33",
      });
    }
    builder.rod("bail", wire, v(-side, bail, 0), v(side, bail, 0), {
      color: "#2c2f33",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, bail, 0), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      grip: "hook",
      aperture: 2 * wire,
      length: 2 * side,
    });
    builder.affordance({
      id: "hook",
      kind: "hook",
      frame: ArchetypeFrame.upright(v(0, bail + wire, 0)),
      extent: null,
    });
    builder.affordance({
      id: "light",
      kind: "socket",
      direction: "along",
      frame: ArchetypeFrame.upright(v(0, fount + globe / 2, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  // A fire torch: the shaft from its butt at the origin, the wick head on its top.
  const length: number = d.length!;
  const head: number = createLight.HEAD;
  const shaft: number = length - head;
  builder.rod("shaft", d.shaftDiameter! / 2, v(0, 0, 0), v(0, shaft, 0), {
    color: "#6b4a2b",
  });
  builder.rod("head", d.headDiameter! / 2, v(0, shaft, 0), v(0, length, 0), {
    color: "#3a3330",
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, shaft / 2, 0), v(0, 0, -1), v(0, 1, 0)),
    extent: null,
    grip: "power",
    aperture: d.shaftDiameter!,
    length: shaft,
  });
  builder.affordance({
    id: "light",
    kind: "socket",
    direction: "along",
    frame: ArchetypeFrame.upright(v(0, length + flame, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createLight}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of three flame lights and three electric lamps, one cited band per dimension per kind; the flame and the beam are frames, never parts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip a hand takes, the hook a lantern or a pendant hangs by, a lamp's switch, and the light a production places (#3501, #3468's N1); the electric flashlight is `createTorch`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every light has the same `grip` and `light`, so carrying, aiming and lighting are written once. Bands seen only in search results are provisional, and a lamp's mass, which no page read gives, is a typical mass; the parts no source sizes are named estimates.
 */
export namespace createLight {
  /** The kinds: a taper candle in its holder, a hurricane lantern, a hand-held fire torch, a desk lamp, a floor lamp and a pendant lamp. */
  export type Kind =
    | "candle"
    | "lantern"
    | "fireTorch"
    | "deskLamp"
    | "floorLamp"
    | "pendant";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "candle",
    "lantern",
    "fireTorch",
    "deskLamp",
    "floorLamp",
    "pendant",
  ];

  /** A desk or floor lamp's shade depth, metres: an estimate; the pages read give its diameter only. */
  export const SHADE: number = 0.1;

  /** A lamp base's thickness, metres: an estimate. */
  export const BASE: number = 0.02;

  /** A lamp stem's radius, metres: an estimate. */
  export const STEM: number = 0.008;

  /** A pendant cord's radius, metres: an estimate. */
  export const CORD: number = 0.003;

  /** A lamp switch's press, metres: an estimate. */
  export const PRESS: number = 0.003;

  /** The flame's frame above the wick's top, metres: an estimate. */
  export const FLAME: number = 0.015;

  /** A candle holder's dish thickness, metres: an estimate. */
  export const DISH: number = 0.005;

  /** A candle holder's socket wall round the taper, metres: an estimate. */
  export const SOCKET_WALL: number = 0.004;

  /** A lantern's fount height, metres: an estimate; the maker gives its capacity, 8 oz, not its height. */
  export const FOUNT: number = 0.065;

  /** A lantern's globe, metres: the Dietz #856 globe's 3 3/8 in height and 2 1/2 in top. */
  export const GLOBE: Readonly<{ height: number; diameter: number }> = {
    height: (3 + 3 / 8) * 0.0254,
    diameter: 2.5 * 0.0254,
  };

  /** A lantern's side tube radius, metres: an estimate. */
  export const TUBE: number = 0.006;

  /** A lantern bail's wire radius, metres: an estimate. */
  export const WIRE: number = 0.0025;

  /** How far a raised bail stands above the lantern's top, metres: an estimate. */
  export const BAIL_RISE: number = 0.06;

  /** A fire torch's wick head length, metres: an estimate. */
  export const HEAD: number = 0.1;

  /**
   * The affordance ids:
   *
   * - `grip`: a candle holder's socket, a lantern's bail, a torch's shaft, a lamp's shade.
   * - `hook`: a lantern's bail at its middle, or a pendant's ceiling end, to hang it by.
   * - `light`: the flame, `+Y` up it, or a lamp's shade mouth, `+Y` down its beam.
   * - `switch`: a desk or floor lamp's push button on its base.
   */
  export type Affordance = "grip" | "hook" | "light" | "switch";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `taper`, `taperDiameter`: a candle's length and thickness.
   * - `holder`: a candle holder's height, where the taper stands.
   * - `dishDiameter`: a candle holder's dish.
   * - `height`: a lantern's to its top, the bail down; a desk or floor lamp's to its shade's top; a pendant's shade.
   * - `base`: a lantern's fount, a lamp's base, across.
   * - `length`: a torch's, butt to wick top.
   * - `shaftDiameter`, `headDiameter`: a torch's shaft and wick head.
   * - `shade`: a lamp's shade across.
   * - `cord`: a pendant's cord from the ceiling to its shade.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "taper"
    | "taperDiameter"
    | "holder"
    | "dishDiameter"
    | "height"
    | "base"
    | "length"
    | "shaftDiameter"
    | "headDiameter"
    | "shade"
    | "cord"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which light. */
    kind: Kind;

    /** The model's id, unique in a scene; `light` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    candle: {
      taper: ArchetypeBand.metres(0.25, 0.26, TAPER, true),
      taperDiameter: ArchetypeBand.metres(0.022, 0.022, TAPER, true),
      holder: ArchetypeBand.metres(0.04, 0.07, HOLDER, true),
      dishDiameter: ArchetypeBand.metres(
        3.25 * 0.0254,
        3.25 * 0.0254,
        HOLDER,
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.15,
        0.4,
        `${ArchetypeBand.TYPICAL_MASS}; the taper is 1.29 kg over twenty, 0.065 kg, by ${TAPER}`,
        true,
      ),
    },
    lantern: {
      height: ArchetypeBand.metres(10.5 * 0.0254, 10.5 * 0.0254, LANTERN),
      base: ArchetypeBand.metres(4.75 * 0.0254, 4.75 * 0.0254, LANTERN),
      mass: ArchetypeBand.of(
        "kg",
        1.08 * 0.4536,
        1.25 * 0.4536,
        LANTERN,
        true,
      ),
    },
    fireTorch: {
      length: ArchetypeBand.metres(16 * 0.0254, 24 * 0.0254, TORCH, true),
      shaftDiameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      headDiameter: ArchetypeBand.metres(0.065, 0.065, TORCH, true),
      mass: ArchetypeBand.of(
        "kg",
        0.3,
        0.6,
        ArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    deskLamp: {
      height: ArchetypeBand.metres(0.35, 0.35, LAMPS),
      base: ArchetypeBand.metres(0.15, 0.15, LAMPS),
      shade: ArchetypeBand.metres(0.12, 0.17, LAMPS),
      mass: ArchetypeBand.of("kg", 0.8, 1.5, ArchetypeBand.TYPICAL_MASS, true),
    },
    floorLamp: {
      height: ArchetypeBand.metres(1.76, 1.76, LAMPS),
      base: ArchetypeBand.metres(0.3, 0.3, LAMPS),
      shade: ArchetypeBand.metres(0.16, 0.16, LAMPS),
      mass: ArchetypeBand.of("kg", 3, 6, ArchetypeBand.TYPICAL_MASS, true),
    },
    pendant: {
      height: ArchetypeBand.metres(11 * 0.0254, 11 * 0.0254, LAMPS),
      shade: ArchetypeBand.metres(15 * 0.0254, 15 * 0.0254, LAMPS),
      cord: ArchetypeBand.metres(
        (4 * 12 + 11) * 0.0254,
        (4 * 12 + 11) * 0.0254,
        LAMPS,
      ),
      mass: ArchetypeBand.of("kg", 0.5, 1, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
