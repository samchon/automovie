import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The maker's ropes read. */
const ROGUE: string =
  "Rogue SR-1 bearing speed ropes: a coated 3/32 in cable of 120 in, or 10 and 11 ft, handles of 5.25 (SR-1S), 6.75 (SR-1) and 7.5 in (SR-1L), tapering to a 7/8 in grip (https://www.roguecanada.ca/rogue-bearing-speed-rope, https://www.roguefitness.com/ca/sr-1s-short-handle-bearing-speed-rope-color-series, https://www.rogueeurope.eu/rogue-sr-1-l-long-handle-speed-rope-eu?locale=en)";

/**
 * A skipping rope: two handles joined by a cord, laid straight on the floor.
 *
 * It lies along `X` centred over the origin, a handle at each end and the cord between them. `leftGrip` (at `+X`) and `rightGrip` (at `-X`) are the handles, taken from above, each along `X`; the cord is rigid and straight here, its swing the act's.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The rope.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the rope lies and its two handles.
 * @evidence contracts/development/implementation.md#principled-implementation A cord rod of the drawn cable length with a handle rod of the drawn length and diameter beyond each end, all resting on the floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the cord, then each handle with its contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cord is one straight rigid rod; a rope that bends is a rig the act would own; the cord's diameter is a named estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createJumpRope(
  params: createJumpRope.IParams = {},
  seed?: number | string,
): Archetype<createJumpRope.Affordance, createJumpRope.Dimension> {
  const d: Record<createJumpRope.Dimension, number> = ArchetypeDraw.dimensions(
    "jumpRope",
    createJumpRope.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createJumpRope.Affordance,
    createJumpRope.Dimension
  > = new ArchetypeBuilder({
    archetype: "jumpRope",
    id: params.id,
    name: "skipping rope",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const r: number = d.gripDiameter / 2;
  const inner: number = d.length / 2;
  const end: number = inner + d.handleLength;
  builder.rod(
    "cord",
    createJumpRope.CORD / 2,
    v(-inner, r, 0),
    v(inner, r, 0),
    {
      color: "#d4a017",
    },
  );
  for (const [id, part, sign] of [
    ["leftGrip", "leftHandle", 1],
    ["rightGrip", "rightHandle", -1],
  ] as const) {
    builder.rod(part, r, v(sign * inner, r, 0), v(sign * end, r, 0), {
      color: "#2c2f33",
    });
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.upright(v((sign * (inner + end)) / 2, r, 0)),
      extent: null,
      grip: "power",
      aperture: d.gripDiameter,
      length: d.handleLength,
    });
  }
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createJumpRope}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension a maker varies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two handles a skip holds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The cable's length, the handles' and the cable's diameter are a maker's as read; the maker gives no weight, so the mass band is provisional.
 */
export namespace createJumpRope {
  /** The cable's diameter, metres: the maker's 3/32 in (see the source). */
  export const CORD: number = (3 / 32) * 0.0254;

  /**
   * The affordance ids:
   *
   * - `leftGrip`, `rightGrip`: the handles at `+X` and `-X`, taken from above.
   */
  export type Affordance = "leftGrip" | "rightGrip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: the cable's, between the handles.
   * - `handleLength`, `gripDiameter`: each handle's.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "handleLength" | "gripDiameter" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `jumpRope` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(120 * 0.0254, 132 * 0.0254, ROGUE),
    handleLength: ArchetypeBand.metres(5.25 * 0.0254, 7.5 * 0.0254, ROGUE),
    gripDiameter: ArchetypeBand.metres(0.875 * 0.0254, 0.875 * 0.0254, ROGUE),
    mass: ArchetypeBand.of("kg", 0.1, 0.3, "the Rogue pages read give no weight", true),
  };
}
