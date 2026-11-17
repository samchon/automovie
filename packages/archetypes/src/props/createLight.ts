import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { LIGHT_BANDS } from "./LIGHT_BANDS";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createLight.Kind, string>> = {
  candle: "candle",
  fireTorch: "fire torch",
  pendant: "pendant",
  tableLamp: "table lamp",
  floorLamp: "floor lamp",
  lantern: "lantern",
};

/**
 * A light a person carries, hangs or stands: a taper candle, a hand-held fire torch, a pendant lamp, a table lamp, a floor lamp or a hurricane lantern.
 *
 * A candle and a torch stand upright on the floor of their own space, `+Y` up; a pendant hangs from its `hook` at the origin, on the ceiling, its cord down to its shade; a table or floor lamp stands on its round base, its stem up to the lampholder inside its shade; a lantern stands on its fount, its globe above it and its cap on top, its bail raised over it along `X`. `grip` is where a hand holds it: anywhere along a candle's taper, a torch's shaft below its head, taken from `-Z`, a lamp's shade, taken from the side to aim it, or a lantern's bail top, hooked from above. A lantern hangs by its `hook`, the same bail top. `light` is where the light comes from, the frame a production places a light at: the top of a candle's wick or a torch's head with `+Y` up the flame, a lantern's burner at its globe's foot with `+Y` up the flame, a pendant's shade mouth with `+Y` down its beam, or a standing lamp's lampholder top with `+Y` up. The light itself is the render's, not the archetype's; the electric flashlight is `createTorch`'s, its `lens` the beam's frame. A candle holder waits for a source of the sizes its contacts need, and a standing lamp's switch for its place and travel.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The light.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each light stands or hangs, where it is held, where its light is and that the light is the render's.
 * @evidence contracts/development/implementation.md#principled-implementation A candle as its taper; a torch as a shaft of its whole length with a wick head at its top; a pendant as a cord and a shade of the read sizes; a standing lamp as its base of the read diameter, its stem to the read lampholder height, and its shade of the read sizes ending at the read overall height, weighing its base's and shade's read net weights together; a lantern as its fount of the read base, its globe of the read height and bottom width, its cap to the read overall height as wide as the globe's read top, and its bail's two sides and top at the read extended height. Every grip's frame lies at the centre of the part it closes on, with that part's span across the grip as the aperture, and every light frame is on the end of a read part.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one branch per kind: its parts, its grip, its light.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The flame and the beam are frames, not parts. The torch's head is drawn as long as its read width, and the cord's radius and a standing lamp's base plate and stem radius are construction estimates; no contact or band reads any of them. A lantern's fount height and bail wire are provisional estimates with their search recorded.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most six parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLight(
  params: createLight.IParams,
  seed?: number | string,
): Archetype<createLight.Affordance, createLight.Dimension> {
  const draw: ArchetypeDrawSession<createLight.Dimension> =
    new ArchetypeDrawSession<createLight.Dimension>(
      "light",
      createLight.UNITS,
      seed,
      params,
    );
  const kind: createLight.Kind = ArchetypeDraw.choice(
    "light",
    "kind",
    params.kind,
    createLight.KINDS,
  );
  const d: Partial<Record<createLight.Dimension, number>> = draw.dimensions(
    createLight.BANDS[kind],
    createLight.BANDS,
  );
  const builder: ArchetypeBuilder<
    createLight.Affordance,
    createLight.Dimension
  > = new ArchetypeBuilder({
    material: kind === "candle" ? "wax" : "composite",
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

  if (kind === "lantern") {
    // The fount up to the burner, the globe over it, the cap to the body's top, and the bail raised over all along X.
    const foot: number = createLight.LANTERN_ESTIMATES.fount;
    const crown: number = foot + d.height!;
    const half: number = d.base! / 2;
    const wire: number = createLight.LANTERN_ESTIMATES.wire;
    // The bail's wire runs on this line, its top at the read raised height.
    const hang: number = d.bail! - wire / 2;
    const color: string = "#9c2a22";
    builder.rod("fount", half, v(0, 0, 0), v(0, foot, 0), { color });
    builder.rod("globe", d.shade! / 2, v(0, foot, 0), v(0, crown, 0), {
      color: "#e8eef0",
    });
    builder.rod(
      "cap",
      createLight.GLOBE_TOP / 2,
      v(0, crown, 0),
      v(0, d.overall!, 0),
      { color },
    );
    for (const [part, sign] of [
      ["bailLeft", 1],
      ["bailRight", -1],
    ] as const)
      builder.rod(
        part,
        wire / 2,
        v(sign * half, foot, 0),
        v(sign * half, hang, 0),
        { color: "#4a4d50" },
      );
    builder.rod("bail", wire / 2, v(-half, hang, 0), v(half, hang, 0), {
      color: "#4a4d50",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, hang, 0), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      grip: "hook",
      aperture: wire,
      length: d.base!,
    });
    builder.affordance({
      id: "hook",
      kind: "hook",
      frame: ArchetypeFrame.upright(v(0, hang, 0)),
      extent: null,
    });
    builder.affordance({
      id: "light",
      kind: "socket",
      direction: "along",
      frame: ArchetypeFrame.upright(v(0, foot, 0)),
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
 * @evidence contracts/development/design.md#principled-representation A closed union of three flame lights and three lamps, one cited band per dimension per kind; the flame and the beam are frames, never parts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip a hand takes, the hook a pendant or a lantern hangs by, and the light a production places (#3501, #3468's N1); the electric flashlight is `createTorch`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every light has the same `grip` and `light`, so carrying, aiming and lighting are written once; bands seen only in search results are provisional, and a lantern's unread fount and wire are named estimates.
 */
export namespace createLight {
  /** The kinds: a taper candle, a hand-held fire torch, a pendant lamp, a table lamp, a floor lamp and a hurricane lantern. */
  export type Kind =
    | "candle"
    | "fireTorch"
    | "pendant"
    | "tableLamp"
    | "floorLamp"
    | "lantern";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "candle",
    "fireTorch",
    "pendant",
    "tableLamp",
    "floorLamp",
    "lantern",
  ];

  /** A lantern's globe across its top, metres: Dietz's 2 3/8 in, the width its cap is drawn at. */
  export const GLOBE_TOP: number = (2 + 3 / 8) * ArchetypeUnits.INCH;

  /**
   * A lantern's parts no source read sizes, metres, provisional estimates: `fount`, the burner's height over the floor, where the globe stands and the flame burns; `wire`, the bail's wire across, the hooked grip's aperture. The search 'Dietz No. 20 Junior lantern fount height inches dimensions bail' found the lantern's height, base, globe, fount capacity and a bail-up height, neither of these.
   */
  export const LANTERN_ESTIMATES: Readonly<{ fount: number; wire: number }> = {
    fount: 0.09,
    wire: 0.003,
  };

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
   * - `grip`: a candle's taper, a torch's shaft below its head, a lamp's shade, a lantern's bail top.
   * - `hook`: a pendant's ceiling end or a lantern's bail top, to hang it by.
   * - `light`: the top of a wick or a torch's head, or a lantern's burner, `+Y` up the flame; a pendant's shade mouth, `+Y` down its beam; a standing lamp's lampholder top, `+Y` up.
   */
  export type Affordance = "grip" | "hook" | "light";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: a candle's taper or a torch, end to end.
   * - `diameter`: a candle's taper or a torch's shaft, across.
   * - `headDiameter`: a torch's wick head.
   * - `height`: a lamp's shade or a lantern's globe, bottom to top.
   * - `shade`: a lamp's shade across, or a lantern's globe across its bottom.
   * - `cord`: a pendant's cord from the ceiling to its shade.
   * - `overall`: a standing lamp, floor to the shade's top; a lantern, floor to its cap's top.
   * - `stem`: a standing lamp's base with its stem, floor to the lampholder's top.
   * - `base`: a standing lamp's or a lantern's base across.
   * - `bail`: a lantern with its bail raised, floor to the bail's top.
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
    | "bail"
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
    bail: "m",
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
  > = LIGHT_BANDS;
}
