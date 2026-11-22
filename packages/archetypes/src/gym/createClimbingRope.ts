import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/**
 * A climbing rope hanging from an overhead anchor, as in a gym or from a
 * hovering helicopter's boom.
 *
 * It hangs above the origin along `+Y`, its anchor `anchor` metres up and its
 * free end `length` below that, a rope longer than its anchor is high lying
 * no lower than the floor. `line` is the rope's middle on its axis, its
 * `+X` along the rope pointing up to the anchor, with the rope's length and
 * radius: a climber grips and locks the feet anywhere along it, and a
 * swinger hangs from it about the anchor.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The rope.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how it hangs and the contact.
 * @evidence contracts/development/implementation.md#principled-implementation One rope rod from the anchor down its length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one rod, one contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sway or stretch is modelled; the sizes are estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms One rod.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createClimbingRope(
  params: createClimbingRope.IParams = {},
  seed?: number | string,
): Archetype<createClimbingRope.Affordance, createClimbingRope.Dimension> {
  const draw: ArchetypeDrawSession<createClimbingRope.Dimension> =
    new ArchetypeDrawSession<createClimbingRope.Dimension>(
      "climbingRope",
      createClimbingRope.UNITS,
      seed,
      params,
    );
  const d: Record<createClimbingRope.Dimension, number> = draw.dimensions(
    createClimbingRope.BANDS,
  );
  const length: number = Math.min(d.length, d.anchor);
  const builder: ArchetypeBuilder<
    createClimbingRope.Affordance,
    createClimbingRope.Dimension
  > = new ArchetypeBuilder({
    material: "fabric",
    id: params.id,
    name: "climbing rope",
    draw,
  });
  builder.rod(
    "rope",
    d.diameter / 2,
    Vector3.create(0, d.anchor - length, 0),
    Vector3.create(0, d.anchor, 0),
    { color: "#c9a96e" },
  );
  builder.affordance({
    id: "line",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, d.anchor - length / 2, 0),
      Vector3.create(0, 0, 1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    length,
    radius: d.diameter / 2,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createClimbingRope}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension, marked estimates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The anchor's height, the rope's length, thickness and mass, and the one contact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No tension is declared: the rope hangs from its anchor.
 */
export namespace createClimbingRope {
  /** The affordance ids: `line`, the rope's middle on its axis, `+X` up the rope. */
  export type Affordance = "line";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `anchor`: the anchor above the floor.
   * - `length`: the rope below the anchor, at most the anchor's height.
   * - `diameter`: the rope's thickness.
   * - `mass`: the rope's, kilograms.
   */
  export type Dimension = "anchor" | "length" | "diameter" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    anchor: "m",
    length: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `climbingRope` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    anchor: ArchetypeBand.metres(
      4,
      12,
      "an estimate: a gym's beam to a helicopter boom over a fast-rope; no rigging sheet was read",
      true,
    ),
    length: ArchetypeBand.metres(
      4,
      12,
      "an estimate: a gym climbing rope to a fast-rope; no rigging sheet was read",
      true,
    ),
    diameter: ArchetypeBand.metres(
      0.03,
      0.045,
      "an estimate: a gym climbing rope to a fast-rope's thickness; no rigging sheet was read",
      true,
    ),
    mass: ArchetypeBand.of(
      "kg",
      3,
      15,
      "an estimate: a fibre rope of the lengths above at 0.6 to 1.2 kg a metre",
      true,
    ),
  };
}
