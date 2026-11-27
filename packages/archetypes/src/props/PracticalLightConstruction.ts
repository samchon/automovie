import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";
import { AutoMovieArchetypeLight } from "./AutoMovieArchetypeLight";

/** The readable name of each kind. */
const NAMES: Readonly<Record<AutoMovieArchetypeLight.Kind, string>> = {
  candle: "candle",
  fireTorch: "fire torch",
  pendant: "pendant",
  tableLamp: "table lamp",
  floorLamp: "floor lamp",
  lantern: "lantern",
};

/** The model-space construction for the selected contact IDs. */
type Builder<Id extends AutoMovieArchetypeLight.Affordance> = AutoMovieArchetypeBuilder<
  Id,
  AutoMovieArchetypeLight.Dimension
>;

/** Model dimensions in the legacy family's recorded units. */
type Dimensions = Partial<Record<AutoMovieArchetypeLight.Dimension, number>>;

/** Practical-light geometry in metres and model-space coordinates. */
const v: typeof Vector3.create = Vector3.create;

/** A started construction: its builder and its drawn dimensions. */
interface IDrawn<Id extends AutoMovieArchetypeLight.Affordance> {
  /** The model-space builder for the selected contact ids. */
  builder: Builder<Id>;

  /** The drawn and fixed dimensions in the family's recorded units. */
  d: Dimensions;
}

/** Open the saved draw stream for the light's particular body and mounting form. */
function draw<Id extends AutoMovieArchetypeLight.Affordance>(
  kind: AutoMovieArchetypeLight.Kind,
  params: Omit<AutoMovieArchetypeLight.IParams, "kind">,
  seed?: number,
): IDrawn<Id> {
  const session: AutoMovieArchetypeDrawSession<AutoMovieArchetypeLight.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeLight.Dimension>(
      "light",
      AutoMovieArchetypeLight.UNITS,
      seed,
      params,
    );
  const d: Partial<Record<AutoMovieArchetypeLight.Dimension, number>> = session.dimensions(
    AutoMovieArchetypeLight.BANDS[kind],
    AutoMovieArchetypeLight.BANDS,
  );
  const builder: Builder<Id> = new AutoMovieArchetypeBuilder({
    material: kind === "candle" ? "wax" : "composite",
    id: params.id,
    name: NAMES[kind],
    draw: session,
  });
  return { builder, d };
}

/**
 * Static practical-light bodies with authored grip, hanging and render-light
 * bindings.
 */
export namespace PracticalLightConstruction {
  /** The contact ids {@link pendant} builds or reads. */
  export type PendantContact = "grip" | "light" | "hook";

  /** Build a suspended lamp with a downward light frame. */
  export function pendant(
    params: Omit<AutoMovieArchetypeLight.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<PendantContact, AutoMovieArchetypeLight.Dimension> {
    const { builder, d }: ReturnType<typeof draw<PendantContact>> =
      draw<PendantContact>("pendant", params, seed);
    // A shade whose mouth faces down, hanging on its cord from the hook at the origin.
    const drop: number = d.cord!;
    const mouth: number = -drop - d.height!;
    builder.rod("cord", AutoMovieArchetypeLight.CORD, v(0, 0, 0), v(0, -drop, 0), {
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
      frame: AutoMovieArchetypeFrame.facing(
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
      frame: AutoMovieArchetypeFrame.facing(
        v(0, mouth, 0),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
    builder.affordance({
      id: "hook",
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  /** The values {@link standing} accepts at this place in its signature. */
  export type StandingKind = "tableLamp" | "floorLamp";

  /** The contact ids {@link standing} builds or reads. */
  export type StandingContact = "grip" | "light";

  /** Build a standing lamp with its source inside the shade. */
  export function standing(
    kind: StandingKind,
    params: Omit<AutoMovieArchetypeLight.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<StandingContact, AutoMovieArchetypeLight.Dimension> {
    const { builder, d }: ReturnType<typeof draw<StandingContact>> =
      draw<StandingContact>(kind, params, seed);
    // A round base on the floor, a stem up to the lampholder, and the shade round it below the lamp's top.
    // The shade weighs its own net weight; the base's net weight is split between the plate and the stem by volume.
    const plate: number = d.base! * AutoMovieArchetypeLight.BASE;
    const stem: number = d.base! * AutoMovieArchetypeLight.STEM;
    const bottom: number = d.overall! - d.height!;
    const shade: number = AutoMovieArchetypeLight.SHADE_MASS[kind] / d.mass!;
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
      frame: AutoMovieArchetypeFrame.facing(
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
      frame: AutoMovieArchetypeFrame.upright(v(0, d.stem!, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  /** The contact ids {@link lantern} builds or reads. */
  export type LanternContact = "grip" | "light" | "hook";

  /** Build a raised-bail lantern with a standing base, grip and hanging hook. */
  export function lantern(
    params: Omit<AutoMovieArchetypeLight.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<LanternContact, AutoMovieArchetypeLight.Dimension> {
    const { builder, d }: ReturnType<typeof draw<LanternContact>> =
      draw<LanternContact>("lantern", params, seed);
    // The fount up to the burner, the globe over it, the cap to the body's top, and the bail raised over all along X.
    const foot: number = AutoMovieArchetypeLight.LANTERN_ESTIMATES.fount;
    const crown: number = foot + d.height!;
    const half: number = d.base! / 2;
    const wire: number = AutoMovieArchetypeLight.LANTERN_ESTIMATES.wire;
    // The bail's wire runs on this line, its top at the read raised height.
    const hang: number = d.bail! - wire / 2;
    const color: string = "#9c2a22";
    builder.rod("fount", half, v(0, 0, 0), v(0, foot, 0), { color });
    // Blended glass: the flame inside draws first at render order -1 and the
    // globe's tint blends over it; the globe casts no shadow, so the light
    // inside it lights the room.
    builder.rod("globe", d.shade! / 2, v(0, foot, 0), v(0, crown, 0), {
      color: "#e8eef0",
      opacity: AutoMovieArchetypeLight.LANTERN_ESTIMATES.globe,
    });
    builder.rod(
      "cap",
      AutoMovieArchetypeLight.GLOBE_TOP / 2,
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
      frame: AutoMovieArchetypeFrame.facing(
        v(0, hang, 0),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "hook",
      aperture: wire,
      length: d.base!,
    });
    builder.affordance({
      id: "hook",
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright(v(0, hang, 0)),
      extent: null,
    });
    builder.affordance({
      id: "light",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.upright(v(0, foot, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  /** The values {@link wick} accepts at this place in its signature. */
  export type WickKind = "candle" | "fireTorch";

  /** The contact ids {@link wick} builds or reads. */
  export type WickContact = "grip" | "light";

  /**
   * Build a candle or a fictional torch body with a light frame at the wick or
   * animated tip.
   */
  export function wick(
    kind: WickKind,
    params: Omit<AutoMovieArchetypeLight.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<WickContact, AutoMovieArchetypeLight.Dimension> {
    const { builder, d }: ReturnType<typeof draw<WickContact>> =
      draw<WickContact>(kind, params, seed);
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
      frame: AutoMovieArchetypeFrame.facing(
        v(0, length / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: kind === "candle" ? "precision" : "power",
      aperture: 2 * radius,
      length: length - head,
    });
    builder.affordance({
      id: "light",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.upright(v(0, length, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }
}
