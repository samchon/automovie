import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** Taper candles, seen only in search results. */
const TAPER: string =
  "IKEA VINTERFINT and KLOKHET unscented taper candles, 25 to 26 cm long and 22 mm across, twenty KLOKHET packed at 1.29 kg, so 64.5 g each, seen only in search results";

/** Hand-held fire torches, seen only in search results. */
const TORCH: string =
  "fire-performance torches with a cloth wick, 16, 20 and 24 in long, Henry's Spitfire Torch's 65 mm wick, and the ARA ECO, Gora and Mephisto torches' 205 to 265 g, seen only in search results";

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), applied to a torch's shaft, whose own diameter no maker states";

/** IKEA's pendant lamp, read, and its weight seen only in search results. */
const PENDANT: string =
  "IKEA SKURUP pendant lamp, 15 in across, 11 in high, cord 4 ft 11 in (https://www.ikea.com/us/en/p/skurup-pendant-lamp-black-70407124/); its 1.35 kg net and 1.37 kg weights seen only in search results";

/** IKEA's RINGSTA/SKAFTET table lamp, read, its shade's net weight seen only in search results. */
const TABLE_LAMP: string =
  "IKEA RINGSTA/SKAFTET table lamp, 41 cm high, base 15 cm, shade 19 cm (https://www.ikea.com/sa/en/p/ringsta-skaftet-table-lamp-white-nickel-plated-s79386565); SKAFTET table lamp base 404.059.56, 30 cm high, base 15 cm, net 0.62 kg (https://www.ikea.com.tw/en/products/luminaires/table-lamps/skaftet-art-40405956); RINGSTA shade 904.040.92, 19 cm wide, 15 cm high (https://www.ikea.com/gb/en/p/ringsta-lamp-shade-white-90404092/), its 0.19 kg net seen only in search results";

/** IKEA's RINGSTA/SKAFTET floor lamp, read. */
const FLOOR_LAMP: string =
  "IKEA RINGSTA/SKAFTET floor lamp, 153 cm high, base 29 cm, shade 42 cm (https://www.ikea.com/gb/en/p/ringsta-skaftet-floor-lamp-white-nickel-plated-s99387446); SKAFTET floor lamp base 804.055.39, 130 cm high, base 29 cm, net 3.06 kg (https://www.ikea.com.tw/en/products/luminaires/floor-lamps/skaftet-art-80405539); RINGSTA shade 704.053.61, 42 cm wide, 31 cm high, net 0.49 kg (https://www.ikea.is/en/products/lighting/luminaires/shades-bases-and-cord-set/ringsta-lamp-shade-art-70405361)";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createLight.Kind, string>> = {
  candle: "candle",
  fireTorch: "fire torch",
  pendant: "pendant",
  tableLamp: "table lamp",
  floorLamp: "floor lamp",
};

/**
 * A light a person carries, hangs or stands: a taper candle, a hand-held fire torch, a pendant lamp, a table lamp or a floor lamp.
 *
 * A candle and a torch stand upright on the floor of their own space, `+Y` up; a pendant hangs from its `hook` at the origin, on the ceiling, its cord down to its shade; a table or floor lamp stands on its round base, its stem up to the lampholder inside its shade. `grip` is where a hand holds it: anywhere along a candle's taper, a torch's shaft below its head, taken from `-Z`, or a lamp's shade, taken from the side to aim it. `light` is where the light comes from, the frame a production places a light at: the top of a candle's wick or a torch's head with `+Y` up the flame, a pendant's shade mouth with `+Y` down its beam, or a standing lamp's lampholder top with `+Y` up. The light itself is the render's, not the archetype's. A candle holder and a hurricane lantern wait for sources of the sizes their contacts need, and a standing lamp's switch for its place and travel.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The light.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each light stands or hangs, where it is held, where its light is and that the light is the render's.
 * @evidence contracts/development/implementation.md#principled-implementation A candle as its taper; a torch as a shaft of its whole length with a wick head at its top; a pendant as a cord and a shade of the read sizes; a standing lamp as its base of the read diameter, its stem to the read lampholder height, and its shade of the read sizes ending at the read overall height, weighing its base's and shade's read net weights together. Every grip's frame lies at the centre of the part it closes on, with that part's span along its `+Y` as the aperture, and every light frame is on the end of a read part.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one branch per kind: its parts, its grip, its light.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The flame and the beam are frames, not parts. The torch's head is drawn as long as its read width, and the cord's radius and a standing lamp's base plate and stem radius are construction estimates; no contact or band reads any of them.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLight(
  params: createLight.IParams,
  seed?: number | string,
): Archetype<createLight.Affordance, createLight.Dimension> {
  const draw: ArchetypeDrawSession<createLight.Dimension> = new ArchetypeDrawSession<createLight.Dimension>("light", createLight.UNITS, seed, params);
  const kind: createLight.Kind = ArchetypeDraw.choice(
    "light",
    "kind",
    params.kind,
    createLight.KINDS,
  );
  const d: Partial<Record<createLight.Dimension, number>> =
    draw.dimensions(createLight.BANDS[kind], createLight.BANDS);
  const builder: ArchetypeBuilder<
    createLight.Affordance,
    createLight.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;

  if (kind === "pendant") {
    // A shade whose mouth faces down, hanging on its cord from the hook at the origin.
    const drop: number = d.cord!;
    const mouth: number = -drop - d.height!;
    builder.rod("cord", createLight.CORD, v(0, 0, 0), v(0, -drop, 0), {
      color: "#2c2f33",
      density: 0.2,
    });
    builder.rod("shade", d.shade! / 2, v(0, mouth, 0), v(0, -drop, 0), {
      color: "#d9d4c7",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(0, mouth + d.height! / 2, 0),
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
    builder.affordance({
      id: "hook",
      kind: "hook",
      frame: ArchetypeFrame.upright(v(0, 0, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  if (kind === "tableLamp" || kind === "floorLamp") {
    // A round base on the floor, a stem up to the lampholder, and the shade round it below the lamp's top.
    // The shade weighs its own net weight; the base's net weight is split between the plate and the stem by volume.
    const plate: number = d.base! * createLight.BASE;
    const stem: number = d.base! * createLight.STEM;
    const bottom: number = d.overall! - d.height!;
    const shade: number = createLight.SHADE_MASS[kind] / d.mass!;
    const plateVolume: number = (d.base! / 2) ** 2 * plate;
    const stemVolume: number = stem ** 2 * (d.stem! - plate);
    const share: number =
      ((1 - shade) * plateVolume) / (plateVolume + stemVolume);
    builder.rod("base", d.base! / 2, v(0, 0, 0), v(0, plate, 0), {
      color: "#b8bbbe",
      share,
    });
    builder.rod("stem", stem, v(0, plate, 0), v(0, d.stem!, 0), {
      color: "#b8bbbe",
      share: 1 - shade - share,
    });
    builder.rod("shade", d.shade! / 2, v(0, bottom, 0), v(0, d.overall!, 0), {
      color: "#efece4",
      share: shade,
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(0, bottom + d.height! / 2, 0),
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
      frame: ArchetypeFrame.upright(v(0, d.stem!, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  // A candle's taper, or a torch's shaft with its wick head at the top: the grip runs below the head.
  const length: number = d.length!;
  const radius: number = d.diameter! / 2;
  const head: number = kind === "fireTorch" ? d.headDiameter! : 0;
  builder.rod("shaft", radius, v(0, 0, 0), v(0, length, 0), {
    color: kind === "candle" ? "#f4efe1" : "#6b4a2b",
  });
  if (kind === "fireTorch")
    builder.rod("head", head / 2, v(0, length - head, 0), v(0, length, 0), {
      color: "#3a3330",
    });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, length / 2, 0), v(0, 0, -1), v(0, 1, 0)),
    extent: null,
    grip: kind === "candle" ? "precision" : "power",
    aperture: 2 * radius,
    length: length - head,
  });
  builder.affordance({
    id: "light",
    kind: "socket",
    direction: "along",
    frame: ArchetypeFrame.upright(v(0, length, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createLight}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of two flame lights and three lamps, one cited band per dimension per kind; the flame and the beam are frames, never parts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip a hand takes, the hook a pendant hangs by, and the light a production places (#3501, #3468's N1); the electric flashlight is `createTorch`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every light has the same `grip` and `light`, so carrying, aiming and lighting are written once; bands seen only in search results are provisional.
 */
export namespace createLight {
  /** The kinds: a taper candle, a hand-held fire torch, a pendant lamp, a table lamp and a floor lamp. */
  export type Kind =
    | "candle"
    | "fireTorch"
    | "pendant"
    | "tableLamp"
    | "floorLamp";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "candle",
    "fireTorch",
    "pendant",
    "tableLamp",
    "floorLamp",
  ];

  /** A pendant cord's radius, metres: a construction estimate that no act reads and no band declares. */
  export const CORD: number = 0.003;

  /** A standing lamp's base plate thickness as a share of its read base diameter: a construction estimate that no act reads and no band declares. */
  export const BASE: number = 0.1;

  /** A standing lamp's stem radius as a share of its read base diameter: a construction estimate that no act reads and no band declares. */
  export const STEM: number = 0.04;

  /** A standing lamp's shade's net weight, kilograms, which places its balance: the RINGSTA shades' 0.19 kg (search only) and 0.49 kg (read), the rest of the lamp's mass its base's. */
  export const SHADE_MASS: Readonly<Record<"tableLamp" | "floorLamp", number>> =
    {
      tableLamp: 0.19,
      floorLamp: 0.49,
    };

  /**
   * The affordance ids:
   *
   * - `grip`: a candle's taper, a torch's shaft below its head, a lamp's shade.
   * - `hook`: a pendant's ceiling end, to hang it by.
   * - `light`: the top of a wick or a torch's head, `+Y` up the flame; a pendant's shade mouth, `+Y` down its beam; a standing lamp's lampholder top, `+Y` up.
   */
  export type Affordance = "grip" | "hook" | "light";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: a candle's taper or a torch, end to end.
   * - `diameter`: a candle's taper or a torch's shaft, across.
   * - `headDiameter`: a torch's wick head.
   * - `height`: a lamp's shade, bottom to top.
   * - `shade`: a lamp's shade across.
   * - `cord`: a pendant's cord from the ceiling to its shade.
   * - `overall`: a standing lamp, floor to the shade's top.
   * - `stem`: a standing lamp's base with its stem, floor to the lampholder's top.
   * - `base`: a standing lamp's base across.
   * - `mass`: kilograms; a standing lamp's is its base's and its shade's net weights together.
   */
  export type Dimension =
    | "length"
    | "diameter"
    | "headDiameter"
    | "height"
    | "shade"
    | "cord"
    | "overall"
    | "stem"
    | "base"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    diameter: "m",
    headDiameter: "m",
    height: "m",
    shade: "m",
    cord: "m",
    overall: "m",
    stem: "m",
    base: "m",
    mass: "kg",
  };

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
      length: ArchetypeBand.metres(0.25, 0.26, TAPER, true),
      diameter: ArchetypeBand.metres(0.022, 0.022, TAPER, true),
      mass: ArchetypeBand.of("kg", 0.0645, 0.0645, TAPER, true),
    },
    fireTorch: {
      length: ArchetypeBand.metres(16 * ArchetypeUnits.INCH, 24 * ArchetypeUnits.INCH, TORCH, true),
      diameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      headDiameter: ArchetypeBand.metres(0.065, 0.065, TORCH, true),
      mass: ArchetypeBand.of("kg", 0.205, 0.265, TORCH, true),
    },
    pendant: {
      height: ArchetypeBand.metres(11 * ArchetypeUnits.INCH, 11 * ArchetypeUnits.INCH, PENDANT),
      shade: ArchetypeBand.metres(15 * ArchetypeUnits.INCH, 15 * ArchetypeUnits.INCH, PENDANT),
      cord: ArchetypeBand.metres(
        4 * ArchetypeUnits.FOOT + 11 * ArchetypeUnits.INCH,
        4 * ArchetypeUnits.FOOT + 11 * ArchetypeUnits.INCH,
        PENDANT,
      ),
      mass: ArchetypeBand.of("kg", 1.35, 1.37, PENDANT, true),
    },
    tableLamp: {
      overall: ArchetypeBand.metres(0.41, 0.41, TABLE_LAMP),
      stem: ArchetypeBand.metres(0.3, 0.3, TABLE_LAMP),
      base: ArchetypeBand.metres(0.15, 0.15, TABLE_LAMP),
      height: ArchetypeBand.metres(0.15, 0.15, TABLE_LAMP),
      shade: ArchetypeBand.metres(0.19, 0.19, TABLE_LAMP),
      mass: ArchetypeBand.of(
        "kg",
        0.62 + 0.19,
        0.62 + 0.19,
        `${TABLE_LAMP}: the base's and the shade's net weights together`,
        true,
      ),
    },
    floorLamp: {
      overall: ArchetypeBand.metres(1.53, 1.53, FLOOR_LAMP),
      stem: ArchetypeBand.metres(1.3, 1.3, FLOOR_LAMP),
      base: ArchetypeBand.metres(0.29, 0.29, FLOOR_LAMP),
      height: ArchetypeBand.metres(0.31, 0.31, FLOOR_LAMP),
      shade: ArchetypeBand.metres(0.42, 0.42, FLOOR_LAMP),
      mass: ArchetypeBand.of(
        "kg",
        3.06 + 0.49,
        3.06 + 0.49,
        `${FLOOR_LAMP}: the base's and the shade's net weights together`,
      ),
    },
  };
}
