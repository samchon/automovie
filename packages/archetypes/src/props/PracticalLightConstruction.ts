import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";
import { createLight } from "./createLight";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createLight.Kind, string>> = {
  candle: "candle",
  fireTorch: "fire torch",
  pendant: "pendant",
  tableLamp: "table lamp",
  floorLamp: "floor lamp",
  lantern: "lantern",
};

/** The model-space construction for the selected contact IDs. */
type Builder<Id extends createLight.Affordance> = ArchetypeBuilder<
  Id,
  createLight.Dimension
>;

/** Model dimensions in the legacy family's recorded units. */
type Dimensions = Partial<Record<createLight.Dimension, number>>;

/** Practical-light geometry in metres and model-space coordinates. */
const v: typeof Vector3.create = Vector3.create;

/** Open the saved draw stream for the light's particular body and mounting form. */
function draw<Id extends createLight.Affordance>(
  kind: createLight.Kind,
  params: Omit<createLight.IParams, "kind">,
  seed?: number | string,
): { builder: Builder<Id>; d: Dimensions } {
  const session: ArchetypeDrawSession<createLight.Dimension> =
    new ArchetypeDrawSession<createLight.Dimension>(
      "light",
      createLight.UNITS,
      seed,
      params,
    );
  const d: Partial<Record<createLight.Dimension, number>> = session.dimensions(
    createLight.BANDS[kind],
    createLight.BANDS,
  );
  const builder: Builder<Id> = new ArchetypeBuilder({
    material: kind === "candle" ? "wax" : "composite",
    id: params.id,
    name: NAMES[kind],
    draw: session,
  });
  return { builder, d };
}

/**
 * Static practical-light bodies with authored grip, hanging and render-light bindings.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Static practical-light bodies with authored grip, hanging and render-light bindings.
 * @evidence contracts/development/design.md#principled-representation Each construction applies the selected variant's coordinate frame and dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the named producers and the legacy selector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape dispatch is shared between unrelated mechanisms.
 */
export namespace PracticalLightConstruction {
  /** The contact ids {@link pendant} builds or reads. */
  export type PendantContact = "grip" | "light" | "hook";

  /**
   * Build a suspended lamp with a downward light frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a suspended lamp with a downward light frame.
   * @evidence contracts/development/implementation.md#principled-implementation Hang the cord from the origin and place the light along the shade's downward axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The published shade and cord dimensions are retained. The socket locates a renderer-owned light.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two solids and three contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function pendant(
    params: Omit<createLight.IParams, "kind">,
    seed?: number | string,
  ): Archetype<PendantContact, createLight.Dimension> {
    const { builder, d }: ReturnType<typeof draw<PendantContact>> =
      draw<PendantContact>("pendant", params, seed);
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

  /** The values {@link standing} accepts at this place in its signature. */
  export type StandingKind = "tableLamp" | "floorLamp";

  /** The contact ids {@link standing} builds or reads. */
  export type StandingContact = "grip" | "light";

  /**
   * Build a standing lamp with its source inside the shade.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a standing lamp with its source inside the shade.
   * @evidence contracts/development/implementation.md#principled-implementation Calculate the stem upward from the base, place the elected shade around the holder and distribute the two measured masses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The base and stem dimensions describe model geometry. The socket locates a renderer-owned light.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three solids and two contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function standing(
    kind: StandingKind,
    params: Omit<createLight.IParams, "kind">,
    seed?: number | string,
  ): Archetype<StandingContact, createLight.Dimension> {
    const { builder, d }: ReturnType<typeof draw<StandingContact>> =
      draw<StandingContact>(kind, params, seed);
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

  /** The contact ids {@link lantern} builds or reads. */
  export type LanternContact = "grip" | "light" | "hook";

  /**
   * Build a raised-bail lantern with a standing base, grip and hanging hook.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a raised-bail lantern with a standing base, grip and hanging hook.
   * @evidence contracts/development/implementation.md#principled-implementation The base supports the burner and globe. The handle and hook share the bail top.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The documented fount and wire estimates fit the measured body, globe and extended height.
   * @evidence contracts/development/implementation.md#efficient-algorithms Six solids and three contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function lantern(
    params: Omit<createLight.IParams, "kind">,
    seed?: number | string,
  ): Archetype<LanternContact, createLight.Dimension> {
    const { builder, d }: ReturnType<typeof draw<LanternContact>> =
      draw<LanternContact>("lantern", params, seed);
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

  /** The values {@link wick} accepts at this place in its signature. */
  export type WickKind = "candle" | "fireTorch";

  /** The contact ids {@link wick} builds or reads. */
  export type WickContact = "grip" | "light";

  /**
   * Build a candle or a fictional torch body with a light frame at the wick or animated tip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a candle or a fictional torch body with a light frame at the wick or animated tip.
   * @evidence contracts/development/implementation.md#principled-implementation Match the shaft diameter and tip frame to the admitted dimensions. Keep the employed grip below the light.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wick and illuminated effect remain renderer bindings. Part colors apply only to the modeled body.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two solids and two contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function wick(
    kind: WickKind,
    params: Omit<createLight.IParams, "kind">,
    seed?: number | string,
  ): Archetype<WickContact, createLight.Dimension> {
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
      frame: ArchetypeFrame.facing(
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
      frame: ArchetypeFrame.upright(v(0, length, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }
}
