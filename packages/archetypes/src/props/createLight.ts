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

/**
 * A light a person carries or hangs: a taper candle, a hand-held fire torch or a pendant lamp.
 *
 * A candle and a torch stand upright on the floor of their own space, `+Y` up; a pendant hangs from its `hook` at the origin, on the ceiling, its cord down to its shade. `grip` is where a hand holds it: anywhere along a candle's taper, a torch's shaft below its head, taken from `-Z`, or a pendant's shade, taken from the side to aim it. `light` is where the light comes from, the frame a production places a light at: the top of a candle's wick or a torch's head with `+Y` up the flame, or a pendant's shade mouth with `+Y` down its beam. The light itself is the render's, not the archetype's. A candle holder, a hurricane lantern and standing lamps wait for sources of the sizes their contacts need.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The light.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each light stands or hangs, where it is held, where its light is and that the light is the render's.
 * @evidence contracts/development/implementation.md#principled-implementation A candle as its taper; a torch as a shaft of its whole length with a wick head at its top; a pendant as a cord and a shade of the read sizes. Every grip's frame lies at the centre of the part it closes on, with that part's span along its `+Y` as the aperture, and every light frame is on the end of a read part.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one branch per kind: its parts, its grip, its light.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The flame and the beam are frames, not parts. The torch's head is drawn as long as its read width, and the cord's radius is a construction estimate; no contact or band reads either.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two parts.
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
 * @evidence contracts/development/design.md#principled-representation A closed union of two flame lights and a lamp, one cited band per dimension per kind; the flame and the beam are frames, never parts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip a hand takes, the hook a pendant hangs by, and the light a production places (#3501, #3468's N1); the electric flashlight is `createTorch`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every light has the same `grip` and `light`, so carrying, aiming and lighting are written once; bands seen only in search results are provisional.
 */
export namespace createLight {
  /** The kinds: a taper candle, a hand-held fire torch and a pendant lamp. */
  export type Kind = "candle" | "fireTorch" | "pendant";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["candle", "fireTorch", "pendant"];

  /** A pendant cord's radius, metres: a construction estimate that no act reads and no band declares. */
  export const CORD: number = 0.003;

  /**
   * The affordance ids:
   *
   * - `grip`: a candle's taper, a torch's shaft below its head, a pendant's shade.
   * - `hook`: a pendant's ceiling end, to hang it by.
   * - `light`: the top of a wick or a torch's head, `+Y` up the flame, or a pendant's shade mouth, `+Y` down its beam.
   */
  export type Affordance = "grip" | "hook" | "light";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: a candle's taper or a torch, end to end.
   * - `diameter`: a candle's taper or a torch's shaft, across.
   * - `headDiameter`: a torch's wick head.
   * - `height`: a pendant's shade.
   * - `shade`: a pendant's shade across.
   * - `cord`: a pendant's cord from the ceiling to its shade.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "diameter"
    | "headDiameter"
    | "height"
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
      length: ArchetypeBand.metres(0.25, 0.26, TAPER, true),
      diameter: ArchetypeBand.metres(0.022, 0.022, TAPER, true),
      mass: ArchetypeBand.of("kg", 0.0645, 0.0645, TAPER, true),
    },
    fireTorch: {
      length: ArchetypeBand.metres(16 * 0.0254, 24 * 0.0254, TORCH, true),
      diameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      headDiameter: ArchetypeBand.metres(0.065, 0.065, TORCH, true),
      mass: ArchetypeBand.of("kg", 0.205, 0.265, TORCH, true),
    },
    pendant: {
      height: ArchetypeBand.metres(11 * 0.0254, 11 * 0.0254, PENDANT),
      shade: ArchetypeBand.metres(15 * 0.0254, 15 * 0.0254, PENDANT),
      cord: ArchetypeBand.metres(
        (4 * 12 + 11) * 0.0254,
        (4 * 12 + 11) * 0.0254,
        PENDANT,
      ),
      mass: ArchetypeBand.of("kg", 1.35, 1.37, PENDANT, true),
    },
  };
}
