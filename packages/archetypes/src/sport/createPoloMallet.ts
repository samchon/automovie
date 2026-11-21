import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/**
 * A polo mallet: a cane shaft with a rubber-wrapped grip and a wrist sling at its top, and a cigar-shaped head set across its foot, struck with the head's long side.
 *
 * It stands on its head at the origin, the shaft straight up along `+Y` to the grip's end, the head lying along `X`. `grip` is the grip the hand closes on; `sling` the loop at the grip's end the wrist passes through; `head` the head's centre, its `+Y` running out of the mallet down the shaft's line, the working point a swing carries through the ball (`tip`); `face` the head's side toward `+Z`, its `+Y` out of it, the striking side of a forehand (a backhand strikes with the other side).
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The mallet.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the mallet stands, its four contacts and what reads them.
 * @evidence contracts/development/implementation.md#principled-implementation A cigar head as a round-ended rod across the shaft's foot, a cane rod up from its middle, a grip rod of the drawn diameter at the top and a sling loop of four rods at the grip's end.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, head, shaft, grip and sling, then the four contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cane is straight, with no whip; the grip's length and the sling's size are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Seven parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createPoloMallet(
  params: createPoloMallet.IParams = {},
  seed?: number | string,
): Archetype<createPoloMallet.Affordance, createPoloMallet.Dimension> {
  const draw: ArchetypeDrawSession<createPoloMallet.Dimension> =
    new ArchetypeDrawSession<createPoloMallet.Dimension>(
      "poloMallet",
      createPoloMallet.UNITS,
      seed,
      params,
    );
  const d: Record<createPoloMallet.Dimension, number> = draw.dimensions(
    createPoloMallet.BANDS,
  );
  const builder: ArchetypeBuilder<
    createPoloMallet.Affordance,
    createPoloMallet.Dimension
  > = new ArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "poloMallet",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const r: number = d.headDiameter / 2;
  const hold: number = createPoloMallet.GRIP_LENGTH;
  builder.rod(
    "head",
    r,
    v(-d.headLength / 2 + r, r, 0),
    v(d.headLength / 2 - r, r, 0),
    { color: "#d9c7a0", density: 1.2, round: true },
  );
  builder.rod(
    "shaft",
    createPoloMallet.CANE / 2,
    v(0, 2 * r, 0),
    v(0, d.length - hold, 0),
    {
      color: "#c8a86b",
    },
  );
  builder.rod(
    "grip",
    d.gripDiameter / 2,
    v(0, d.length - hold, 0),
    v(0, d.length, 0),
    {
      color: "#2b2622",
    },
  );
  // The sling: a flat loop hanging from the grip's end, drawn as four thin rods.
  const s: number = createPoloMallet.SLING;
  const top: number = d.length;
  const corners: readonly ReturnType<typeof v>[] = [
    v(0, top, 0),
    v(s / 2, top - s / 2, 0),
    v(0, top - s, 0),
    v(-s / 2, top - s / 2, 0),
  ];
  corners.forEach((from, k: number): void => {
    builder.rod(`sling${k}`, 0.004, from, corners[(k + 1) % corners.length]!, {
      color: "#4a3b2a",
    });
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      v(0, d.length - hold / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.gripDiameter,
    length: hold,
  });
  builder.affordance({
    id: "sling",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, top - s / 2, 0), v(0, 0, -1), v(0, 1, 0)),
    extent: null,
    grip: "power",
    aperture: s,
    length: s,
  });
  builder.affordance({
    id: "head",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.facing(v(0, r, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(v(0, r, r), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    width: d.headLength,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createPoloMallet}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension; every figure no source read gives is provisional and says so.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip and sling the hand takes, the head and face a swing reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The cane's diameter, the grip's length and the sling are named estimates.
 */
export namespace createPoloMallet {
  /** The cane shaft's diameter, metres: an estimate. */
  export const CANE: number = 0.014;

  /** The grip's length, metres: an estimate. */
  export const GRIP_LENGTH: number = 0.2;

  /** The sling loop's height, metres: an estimate, wide enough for a wrist. */
  export const SLING: number = 0.12;

  /**
   * The affordance ids:
   *
   * - `grip`: the grip, taken from `-Z`, its length along the shaft.
   * - `sling`: the wrist loop at the grip's end.
   * - `head`: the head's centre, its `+Y` down the shaft's line out of the mallet.
   * - `face`: the head's forehand side toward `+Z`.
   */
  export type Affordance = "grip" | "sling" | "head" | "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the head's underside to the grip's end.
   * - `headLength`: the head from end to end.
   * - `headDiameter`: the head across.
   * - `gripDiameter`: the grip's.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "headLength"
    | "headDiameter"
    | "gripDiameter"
    | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    headLength: "m",
    headDiameter: "m",
    gripDiameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `poloMallet` when absent. */
    id?: string;
  }

  /** What no source read gives. */
  const UNREAD: string = "no source read gives it; provisional";

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(
      48 * ArchetypeUnits.INCH,
      54 * ArchetypeUnits.INCH,
      `polo mallets are sold from 48 to 54 in by the pony's height; ${UNREAD}`,
      true,
    ),
    headLength: ArchetypeBand.metres(0.21, 0.24, UNREAD, true),
    headDiameter: ArchetypeBand.metres(0.045, 0.055, UNREAD, true),
    gripDiameter: ArchetypeBand.metres(0.025, 0.03, UNREAD, true),
    mass: ArchetypeBand.of("kg", 0.45, 0.6, UNREAD, true),
  };
}
