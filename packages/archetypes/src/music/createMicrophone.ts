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

/** The handheld microphone read: the one whose length, head, tail and mass were all read, so it is built whole. */
const HANDHELD: string =
  "Sennheiser e 835, 180.5 mm long, 49.2 mm head and 25.08 mm tail, 330 g (https://www.sennheiser.com/globalassets/digizuite/41678-en-sp_1209_v1.0_e_835_e_835-s_product_specification_en.pdf)";

/** The stand read. */
const AURAY: string =
  "Auray MS-5230F tripod boom stand: 36 to 36.2 in (91.4 to 91.9 cm) to 63 in (160 cm) high, a 31 to 31.5 in (80 cm) boom, legs spread 26 in (65 cm), 2 kg (https://www.bhphotovideo.com/c/product/755877-REG/auray_ms_5230f_tripod_microphone_stand.html)";

/**
 * A microphone: a handheld vocal microphone, or a tripod boom stand that holds one.
 *
 * A handheld microphone lies along `+X`, its tail at the origin and its grille's tip toward `+X`: `grip` is its handle, held round, and `head` the grille's tip, the working point whose `+Y` runs along the microphone toward the mouth it is sung into.
 *
 * A boom stand stands on its tripod at the origin, its boom reaching out along `+Z` toward whoever sings at it: `height` is the upright's top, a slider whose travel raises the upper tube, the boom and the clip from the stand's lowest height to its highest; no source read says where the stand is gripped, so it declares no grip; `clip` the socket at the boom's tip where a microphone's adapter seats, riding `height`.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The microphone or stand.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only the other kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each kind lies or stands and every contact, with the slider's direction.
 * @evidence contracts/development/implementation.md#principled-implementation A handle rod of the tail's diameter and a grille ball of the head's, spanning the length, all one microphone's; three legs to the cited spread, a lower and an upper tube at the stand's lowest height, a level boom of the cited length and a clip at its end, the upper tube, boom and clip bound to the height slider whose travel is the cited range.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one branch per kind with its parts and contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A handle's taper and a boom's tilt are not drawn; the tubes' diameters, the legs' hub height, the tubes' overlap and the clip's size are named construction estimates (`createMicrophone.ESTIMATES`), none placing a contact.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most eight parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createMicrophone(
  params: createMicrophone.IParams,
  seed?: number | string,
): Archetype<createMicrophone.Affordance, createMicrophone.Dimension> {
  const draw: ArchetypeDrawSession<createMicrophone.Dimension> = new ArchetypeDrawSession<createMicrophone.Dimension>("microphone", createMicrophone.UNITS, seed, params);
  const kind: createMicrophone.Kind = ArchetypeDraw.choice(
    "microphone",
    "kind",
    params.kind,
    createMicrophone.KINDS,
  );
  const d: Partial<Record<createMicrophone.Dimension, number>> =
    draw.dimensions(createMicrophone.BANDS[kind], createMicrophone.BANDS);
  const builder: ArchetypeBuilder<
    createMicrophone.Affordance,
    createMicrophone.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: kind === "handheld" ? "microphone" : "microphone stand",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const E: typeof createMicrophone.ESTIMATES = createMicrophone.ESTIMATES;
  if (kind === "handheld") {
    const length: number = d.length!;
    const head: number = d.head!;
    const tail: number = d.tail!;
    const axis: number = head / 2;
    const neck: number = length - head;
    builder.rod("handle", tail / 2, v(0, axis, 0), v(neck, axis, 0), {
      color: "#3a3d42",
    });
    builder.ball("grille", head / 2, v(neck + head / 2, axis, 0), {
      color: "#b9bcc0",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(neck / 2, axis, 0),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: tail,
      length: neck,
    });
    builder.affordance({
      id: "head",
      kind: "socket",
      direction: "along",
      frame: ArchetypeFrame.facing(v(length, axis, 0), v(1, 0, 0), v(0, 0, 1)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  // The tripod: three legs from the hub to feet on the cited spread's circle, one back along -Z, away from the boom.
  const low: number = d.minHeight!;
  const legR: number = E.leg / 2;
  for (let k: number = 0; k < 3; k++) {
    const angle: number = Math.PI / 2 + (2 * Math.PI * k) / 3;
    builder.rod(
      `leg-${k + 1}`,
      legR,
      v(0, E.hub, 0),
      v(
        (Math.cos(angle) * d.spread!) / 2,
        legR,
        (-Math.sin(angle) * d.spread!) / 2,
      ),
      { color: "#2b2b2e", round: true },
    );
  }
  const sleeve: number = low - E.overlap;
  builder.rod("lower-tube", E.lower / 2, v(0, E.hub, 0), v(0, sleeve, 0), {
    color: "#2b2b2e",
  });
  builder.rod(
    "upper-tube",
    E.upper / 2,
    v(0, sleeve - E.overlap, 0),
    v(0, low, 0),
    {
      color: "#55595f",
    },
  );
  builder.rod("boom", E.upper / 2, v(0, low, 0), v(0, low, d.boom!), {
    color: "#55595f",
  });
  builder.box("clip", v(0.03, E.clip, 0.03), v(0, low + E.clip / 2, d.boom!), {
    color: "#2b2b2e",
  });
  builder.affordance({
    id: "height",
    kind: "slider",
    frame: ArchetypeFrame.facing(v(0, low, 0), v(0, 0, 1), v(0, 1, 0)),
    extent: null,
    travel: d.maxHeight! - low,
    parts: ["upper-tube", "boom", "clip"],
  });
  builder.affordance({
    id: "clip",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0, low, d.boom!)),
    extent: null,
    rides: "height",
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createMicrophone}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and estimate states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind; the stand's height range is an articulation's travel, not a dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip and the head a singer's hand and mouth meet, and the clip and height a stand is loaded and set by (#3468 F8).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The stand's tube sizes, hub and clip are named estimates; the boom does not tilt; the handheld is the Sennheiser e 835 alone, since no other microphone's tail was read to build one whole.
 */
export namespace createMicrophone {
  /** The kinds. */
  export type Kind = "handheld" | "boomStand";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["handheld", "boomStand"];

  /**
   * The sizes no source read gives, metres, each an estimate: `lower`, `upper`, `leg`, the stand's tubes' diameters; `hub`, the legs' hub height; `overlap`, how far the upper tube runs inside the lower at its lowest; `clip`, the clip's height.
   */
  export const ESTIMATES: Readonly<{
    lower: number;
    upper: number;
    leg: number;
    hub: number;
    overlap: number;
    clip: number;
  }> = {
    lower: 0.025,
    upper: 0.019,
    leg: 0.016,
    hub: 0.25,
    overlap: 0.1,
    clip: 0.04,
  };

  /**
   * The affordance ids:
   *
   * - handheld: `grip` (handle), `head` (socket, the working point along the microphone);
   * - boomStand: `height` (slider), `clip` (socket riding `height`).
   */
  export type Affordance = "grip" | "head" | "height" | "clip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`, `head`, `tail`: a handheld microphone's length, grille diameter and handle diameter.
   * - `minHeight`, `maxHeight`: a stand's upright at its lowest and highest; `boom`: its boom; `spread`: its legs' spread.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "head"
    | "tail"
    | "minHeight"
    | "maxHeight"
    | "boom"
    | "spread"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    head: "m",
    tail: "m",
    minHeight: "m",
    maxHeight: "m",
    boom: "m",
    spread: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which one. */
    kind: Kind;

    /** The model's id, unique in a scene; `microphone` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    handheld: {
      length: ArchetypeBand.metres(0.1805, 0.1805, HANDHELD),
      head: ArchetypeBand.metres(0.0492, 0.0492, HANDHELD),
      tail: ArchetypeBand.metres(0.02508, 0.02508, HANDHELD),
      mass: ArchetypeBand.of("kg", 0.33, 0.33, HANDHELD),
    },
    boomStand: {
      minHeight: ArchetypeBand.metres(0.914, 0.919, AURAY),
      maxHeight: ArchetypeBand.metres(1.6, 1.6, AURAY),
      boom: ArchetypeBand.metres(31 * ArchetypeUnits.INCH, 0.8, AURAY),
      spread: ArchetypeBand.metres(0.65, 0.65, AURAY),
      mass: ArchetypeBand.of("kg", 2, 2, AURAY),
    },
  };
}
