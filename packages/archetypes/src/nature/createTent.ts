import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** UNHCR's family tent, read in its specification. */
const UNHCR: string =
  'UNHCR Family Tent, eco-design (SH-TE-10028), specification (https://www.unhcr.org/sites/default/files/2025-02/family-tent-eco-design.pdf): outer frame "Centre height: 2.2 m / Width: 4 m / Ridge length: 4 m / Side wall height: 1.25 - 1.40 m / Door height: 1.4 m / Centre base length: 6.6 m" (p. 9), its drawing\'s 1.40 m end width (p. 5); outer "Door size: W 1.3 x H 1.4 m" (p. 10); inner doors "1 m wide and 1.75 m high from the floor" (p. 12); "approximately 49-53 kg" packed (p. 6)';

/**
 * A relief family tent: UNHCR's eco-design family tent, a ridge tent with a vestibule at each end. Not a backpacking or camping tent, whose doors no maker read gives.
 *
 * It stands on the ground at the origin, its ridge along `Z`, `+Y` up: its side walls a box as wide and as long as the frame, as high as a side wall; its roof two slabs from the walls' tops up to the ridge at the centre height; a vestibule at each end of the frame's end width, as high as the outer door, reaching out to the centre base length. The slabs' thickness is a construction detail no act reads. `frontDoor` and `backDoor` are the outer doors at the vestibules' ends, `+Z` and `-Z`; `frontInnerDoor` and `backInnerDoor` the inner doors at the frame's ends, each an aperture at its read width and height. Its mass is the specification's packed weight. It stands pegged on soil, which no measured pair covers, so it carries no friction.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The tent.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the tent is and is not, how it stands, its parts, its doors and its mass.
 * @evidence contracts/development/implementation.md#principled-implementation A walls box, two roof slabs and two vestibule boxes from the specification's read sizes, the vestibules reaching half the base length beyond the frame's centre; four apertures at the read door sizes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the body, the roof, the vestibules, then the doors.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Fabric, poles, guy ropes and the vestibules' sloped ends are not drawn; the roof slabs' thickness is a construction detail no act reads.
 * @evidence contracts/development/implementation.md#efficient-algorithms Five parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createTent(
  params: createTent.IParams,
  seed?: number | string,
): Archetype<createTent.Affordance, createTent.Dimension> {
  const draw: ArchetypeDrawSession<createTent.Dimension> =
    new ArchetypeDrawSession<createTent.Dimension>(
      "tent",
      createTent.UNITS,
      seed,
      params,
    );
  const kind: createTent.Kind = ArchetypeDraw.choice(
    "tent",
    "kind",
    params.kind,
    createTent.KINDS,
  );
  const d: Record<createTent.Dimension, number> = draw.dimensions(
    createTent.BANDS[kind],
  );
  const builder: ArchetypeBuilder<createTent.Affordance, createTent.Dimension> =
    new ArchetypeBuilder({
      id: params.id,
      name: "relief family tent",
      draw,
    });
  const v: typeof Vector3.create = Vector3.create;
  const canvas: string = "#c9c2a8";

  // The side walls' box, and the roof's two slabs from the walls' tops up to the ridge.
  const half: number = d.width / 2;
  builder.box("walls", v(d.width, d.wall, d.ridge), v(0, d.wall / 2, 0), {
    color: canvas,
  });
  const rise: number = d.centre - d.wall;
  const slope: number = Math.hypot(half, rise);
  const tilt: number = Math.atan2(rise, half);
  const thick: number = d.width * createTent.SLAB;
  for (const [id, sign] of [
    ["roofLeft", 1],
    ["roofRight", -1],
  ] as const)
    builder.box(
      id,
      v(slope, thick, d.ridge),
      v((sign * half) / 2, d.wall + rise / 2, 0),
      {
        color: canvas,
        rotation: {
          x: 0,
          y: 0,
          z: Math.sin((-sign * tilt) / 2),
          w: Math.cos((-sign * tilt) / 2),
        },
      },
    );

  // A vestibule at each end, out to half the base length, as high as the outer door.
  const reach: number = (d.base - d.ridge) / 2;
  for (const [id, sign] of [
    ["vestibuleFront", 1],
    ["vestibuleBack", -1],
  ] as const)
    builder.box(
      id,
      v(d.endWidth, d.door, reach),
      v(0, d.door / 2, sign * (d.ridge / 2 + reach / 2)),
      { color: canvas },
    );

  // The doors: the outer ones at the vestibules' ends, the inner ones at the frame's ends.
  for (const [id, z, width, height] of [
    ["frontDoor", d.base / 2, d.doorWidth, d.door],
    ["backDoor", -d.base / 2, d.doorWidth, d.door],
    ["frontInnerDoor", d.ridge / 2, d.innerWidth, d.innerHeight],
    ["backInnerDoor", -d.ridge / 2, d.innerWidth, d.innerHeight],
  ] as const)
    builder.affordance({
      id,
      kind: "aperture",
      frame: ArchetypeFrame.upright(v(0, 0, z)),
      extent: null,
      width,
      height,
    });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createTent}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of tents named for what they are, each band the specification's read figure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The doors a person passes and the tent's extent (#3468's N9).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A camping tent is not built until a maker gives its door's width and height; the relief tent's doors are its specification's.
 */
export namespace createTent {
  /** The kinds: UNHCR's relief family tent. */
  export type Kind = "reliefFamily";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["reliefFamily"];

  /** A roof slab's thickness as a share of the frame's width: a construction detail no act reads. */
  export const SLAB: number = 0.005;

  /**
   * The affordance ids:
   *
   * - `frontDoor`, `backDoor`: the outer doors at the vestibules' ends, `+Z` and `-Z`.
   * - `frontInnerDoor`, `backInnerDoor`: the inner doors at the frame's ends.
   */
  export type Affordance =
    | "frontDoor"
    | "backDoor"
    | "frontInnerDoor"
    | "backInnerDoor";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: the frame across, along `X`.
   * - `ridge`: the frame's ridge length, along `Z`.
   * - `centre`: the ridge's height.
   * - `wall`: a side wall's height.
   * - `base`: the centre base length, vestibules included.
   * - `endWidth`: a vestibule's width.
   * - `door`, `doorWidth`: an outer door's height and width.
   * - `innerWidth`, `innerHeight`: an inner door's width and height.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "ridge"
    | "centre"
    | "wall"
    | "base"
    | "endWidth"
    | "door"
    | "doorWidth"
    | "innerWidth"
    | "innerHeight"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    ridge: "m",
    centre: "m",
    wall: "m",
    base: "m",
    endWidth: "m",
    door: "m",
    doorWidth: "m",
    innerWidth: "m",
    innerHeight: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which tent. */
    kind: Kind;

    /** The model's id, unique in a scene; `tent` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    reliefFamily: {
      width: ArchetypeBand.metres(4, 4, UNHCR),
      ridge: ArchetypeBand.metres(4, 4, UNHCR),
      centre: ArchetypeBand.metres(2.2, 2.2, UNHCR),
      wall: ArchetypeBand.metres(1.25, 1.4, UNHCR),
      base: ArchetypeBand.metres(6.6, 6.6, UNHCR),
      endWidth: ArchetypeBand.metres(1.4, 1.4, UNHCR),
      door: ArchetypeBand.metres(1.4, 1.4, UNHCR),
      doorWidth: ArchetypeBand.metres(1.3, 1.3, UNHCR),
      innerWidth: ArchetypeBand.metres(1, 1, UNHCR),
      innerHeight: ArchetypeBand.metres(1.75, 1.75, UNHCR),
      mass: ArchetypeBand.of("kg", 49, 53, UNHCR),
    },
  };
}
