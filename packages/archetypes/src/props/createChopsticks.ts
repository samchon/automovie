import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";

/**
 * An adult's pair of chopsticks: 0.24 m long, the length Hsu and Wu found
 * best for adults, and 6 mm across, the diameter Chan (1999, Int J Ind
 * Ergon) found best for food-pinching efficiency, both as the 2017 MATEC
 * Web of Conferences study of chopstick operation summarizes them
 * (https://www.matec-conferences.org/10.1051/matecconf/201711901017, read
 * through its search summary). The spread and the mass are provisional
 * construction estimates.
 */
const SIZE: Readonly<createChopsticks.ISize> = {
  length: 0.24,
  diameter: 0.006,
  spread: 12,
  mass: 0.02,
};

/**
 * A pair of chopsticks held in the conventional hold: the lower stick fixed
 * against the thumb's base and the ring finger, the upper stick moved by
 * the index and middle fingers.
 *
 * The lower stick is the prop's frame, running along `+Z` from its butt at
 * the origin to its tip. The upper stick lies above it (`+Y`) and turns
 * about a fulcrum a third of the way along, at the thumb's tip, on the
 * `pinch` hinge: open at 0, spread `spread` degrees, and closed at
 * `spread`, its tip on the lower one's. `grip` is the hold a third of the
 * way along, `tips` the meeting point of the two tips, where a morsel is
 * pinched.
 *
 * @param params The optional scene id.
 * @returns The chopsticks and their contacts, metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the length and diameter sources, the hold, the frame, the hinge and each contact.
 * @evidence contracts/development/implementation.md#principled-implementation Two rods, the upper on a hinge at the thumb's fulcrum, spread open at rest and closed on the lower tip at the hinge's end.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Record the size, lay both sticks, then the hinge, the hold and the tips.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Spread and mass are named estimates; the length and diameter are the cited optima.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two parts and three contacts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs.
 */
export function createChopsticks(
  params: createChopsticks.IParams = {},
): Archetype<createChopsticks.Affordance, createChopsticks.Dimension> {
  const v: typeof Vector3.create = Vector3.create;
  const r: number = SIZE.diameter / 2;
  const fulcrum: number = SIZE.length / 3;
  const rise: number =
    Math.tan((SIZE.spread * Math.PI) / 180) * (SIZE.length - fulcrum);
  const draw: ArchetypeDrawSession<createChopsticks.Dimension> =
    new ArchetypeDrawSession(
      "chopsticks",
      { length: "m", diameter: "m", mass: "kg" },
      undefined,
    );
  draw.derive("length", SIZE.length);
  draw.derive("diameter", SIZE.diameter);
  draw.derive("mass", SIZE.mass);
  const builder: ArchetypeBuilder<
    createChopsticks.Affordance,
    createChopsticks.Dimension
  > = new ArchetypeBuilder({
    id: params.id ?? "chopsticks",
    name: "chopsticks",
    material: "wood",
    draw,
  });
  builder.rod("lower", r, v(0, 0, 0), v(0, 0, SIZE.length), {
    color: "#a0743c",
  });
  // Open, the upper stick rises from the fulcrum toward its tip.
  builder.rod("upper", r, v(0, 2 * r, 0), v(0, 2 * r + rise, SIZE.length), {
    color: "#a0743c",
  });
  builder.affordance({
    id: "pinch",
    kind: "hinge",
    extent: null,
    travel: SIZE.spread,
    parts: ["upper"],
    frame: ArchetypeFrame.facing(v(0, 2 * r, fulcrum), v(1, 0, 0), v(0, 0, 1)),
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(v(0, r, fulcrum), v(0, -1, 0), v(0, 0, 1)),
    extent: null,
    grip: "precision",
    aperture: 3 * SIZE.diameter,
    length: 0.06,
  });
  builder.affordance({
    id: "tips",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0, r, SIZE.length)),
    extent: null,
  });
  return builder.build(SIZE.mass);
}

/**
 * The inputs, contacts and size of {@link createChopsticks}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the scene id input, the contacts, the dimensions and the size.
 * @evidence contracts/development/design.md#principled-representation Metres, degrees and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pinch, the hold and the tips an act reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The size is fixed; no dimension is authorable.
 */
export namespace createChopsticks {
  /** The upper stick's hinge, the hold and the tips. */
  export type Affordance = "pinch" | "grip" | "tips";

  /** The length, the diameter and the mass. */
  export type Dimension = "length" | "diameter" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `chopsticks` when absent. */
    id?: string;
  }

  /** The pair's size, metres, degrees and kilograms. */
  export interface ISize {
    /** Each stick's length. */
    length: number;

    /** Each stick's diameter. */
    diameter: number;

    /** The open spread between the sticks, degrees. */
    spread: number;

    /** The pair's mass. */
    mass: number;
  }
}
