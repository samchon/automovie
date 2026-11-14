import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** What a maker's pram reads as, not read at a source. */
const MAKER: string = "a common maker's pram, not read at a source";

/**
 * A pram (a baby carriage): a bassinet on a four-wheeled chassis, pushed by a bar at its back.
 *
 * It stands on the floor with its front toward `+Z` and the person pushing it behind at `-Z`, as `createCart`'s trolley does. `handle` is the push bar across its back, taken from above along `+X`; `bassinet` the bassinet's floor, where a baby lies.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The pram.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the pram stands, who pushes it from where and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Four wheel discs at the chassis' corners, a bassinet box of the drawn length and width on them, two push rods from its back up and back to the drawn handle height, and the push bar across their tops.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the wheels, the bassinet, the push rods and the bar, then the two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No hood, springs or brake; the wheels do not turn; the wheels', bassinet's and rods' sizes are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Eight parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createPram(
  params: createPram.IParams = {},
  seed?: number | string,
): Archetype<createPram.Affordance, createPram.Dimension> {
  const d: Record<createPram.Dimension, number> = ArchetypeDraw.dimensions(
    "pram",
    createPram.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<createPram.Affordance, createPram.Dimension> =
    new ArchetypeBuilder({
      archetype: "pram",
      id: params.id,
      name: "pram",
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;
  const wheel: number = createPram.WHEEL;
  const hx: number = d.width / 2;
  const hz: number = d.length / 2;
  for (const [id, x, z] of [
    ["frontLeftWheel", hx, hz],
    ["frontRightWheel", -hx, hz],
    ["backLeftWheel", hx, -hz],
    ["backRightWheel", -hx, -hz],
  ] as const)
    builder.rod(id, wheel, v(x - 0.015, wheel, z), v(x + 0.015, wheel, z), {
      color: "#1d1f22",
    });
  const floor: number = 2 * wheel + createPram.CLEARANCE;
  const deep: number = createPram.DEPTH;
  builder.box(
    "bassinet",
    v(d.width - 0.06, deep, d.length),
    v(0, floor + deep / 2, 0),
    {
      color: "#3a4a6b",
    },
  );
  // The push rods from the bassinet's back up and back to the bar.
  const back: number = -hz - createPram.REACH;
  const grip: number = createPram.GRIP;
  for (const [id, x] of [
    ["leftPushRod", hx - 0.05],
    ["rightPushRod", -hx + 0.05],
  ] as const)
    builder.rod(
      id,
      grip / 2,
      v(x, floor + deep, -hz),
      v(x, d.handleHeight, back),
      {
        color: "#8a8d91",
      },
    );
  builder.rod(
    "bar",
    grip / 2,
    v(-hx + 0.05, d.handleHeight, back),
    v(hx - 0.05, d.handleHeight, back),
    {
      color: "#2c2f33",
    },
  );
  builder.affordance({
    id: "handle",
    kind: "bar",
    frame: ArchetypeFrame.upright(v(0, d.handleHeight, back)),
    extent: null,
    grip: "power",
    aperture: grip,
    length: d.width - 0.1,
  });
  builder.affordance({
    id: "bassinet",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, floor + createPram.FLOOR, 0)),
    extent: null,
    width: d.width - 0.1,
    depth: d.length - 0.04,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createPram}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension a maker varies; the handle's height is the one a push reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bar a push takes, named as `createCart`'s trolley names it, and the bassinet.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source was read, so every band is provisional; the parts' sizes are named estimates.
 */
export namespace createPram {
  /** The wheels' radius, metres: an estimate. */
  export const WHEEL: number = 0.12;

  /** The bassinet's underside above the wheels' tops, metres: an estimate. */
  export const CLEARANCE: number = 0.15;

  /** The bassinet's depth, metres: an estimate. */
  export const DEPTH: number = 0.25;

  /** The bassinet's floor above its underside, metres: an estimate. */
  export const FLOOR: number = 0.03;

  /** The push bar behind the bassinet's back, metres: an estimate. */
  export const REACH: number = 0.3;

  /** The push bar's and rods' diameter, metres: an estimate. */
  export const GRIP: number = 0.03;

  /**
   * The affordance ids:
   *
   * - `handle`: the push bar across the back, taken from above along `+X`.
   * - `bassinet`: the bassinet's floor, facing up.
   */
  export type Affordance = "handle" | "bassinet";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`, `width`: the chassis', wheel to wheel.
   * - `handleHeight`: the push bar's axis above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "handleHeight" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `pram` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(0.75, 0.9, MAKER, true),
    width: ArchetypeBand.metres(0.55, 0.62, MAKER, true),
    handleHeight: ArchetypeBand.metres(0.95, 1.1, MAKER, true),
    mass: ArchetypeBand.of("kg", 9, 15, MAKER, true),
  };
}
