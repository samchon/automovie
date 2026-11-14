import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The high chair read. */
const ANTILOP: string =
  "IKEA ANTILOP high chair: width 56 cm, depth 59 cm, height 90 cm, seat height 54 cm, seat width 25 cm and depth 22 cm (https://www.ikea.com.tr/en/p89041709)";

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `leg`, a leg's diameter; `shell`, the seat shell's thickness. */
const ESTIMATES: Readonly<{ leg: number; shell: number }> = {
  leg: 0.025,
  shell: 0.02,
};

/**
 * A child's high chair: a seat shell on four splayed legs, its back rising to the chair's height.
 *
 * The chair stands on the floor at the origin, facing `+Z`. Its legs run from the corners of the maker's footprint up to the seat's corners; the seat lies at the maker's seat height and its back stands at the seat's rear edge up to the chair's height. `seat` is the seat a child is set on and lifted from, facing `+Z`. The tray is not built, since no source read sizes or places it; setting a child in and lifting one out is a two-body act with no motion law yet (#3440).
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The chair.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the chair stands, its contact, and what is left out with the missing law.
 * @evidence contracts/development/implementation.md#principled-implementation The maker's footprint, height, seat height and seat size; each leg a rod from a footprint corner to the matching seat corner.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the legs, the seat and back, then the contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tray or harness; the legs' and shell's sections are construction estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Six parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHighChair(
  params: createHighChair.IParams = {},
  seed?: number | string,
): Archetype<createHighChair.Affordance, createHighChair.Dimension> {
  const d: Record<createHighChair.Dimension, number> = ArchetypeDraw.dimensions(
    "highChair",
    createHighChair.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createHighChair.Affordance,
    createHighChair.Dimension
  > = new ArchetypeBuilder({
    archetype: "highChair",
    id: params.id,
    name: "high chair",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const E: typeof ESTIMATES = ESTIMATES;
  const seat: number = d.seatHeight;
  const half: { x: number; z: number } = { x: d.seatWidth / 2, z: d.seatDepth / 2 };
  const foot: { x: number; z: number } = {
    x: d.width / 2 - E.leg / 2,
    z: d.depth / 2 - E.leg / 2,
  };
  for (const [id, sx, sz] of [
    ["leg-1", 1, 1],
    ["leg-2", -1, 1],
    ["leg-3", 1, -1],
    ["leg-4", -1, -1],
  ] as const)
    builder.rod(
      id,
      E.leg / 2,
      v(sx * foot.x, E.leg / 2, sz * foot.z),
      v(sx * half.x, seat - E.shell, sz * half.z),
      { color: "#d9c7a7", round: true },
    );
  builder.box(
    "seat",
    v(d.seatWidth, E.shell, d.seatDepth),
    v(0, seat - E.shell / 2, 0),
    { color: "#f2f2f2" },
  );
  builder.box(
    "back",
    v(d.seatWidth, d.height - seat, E.shell),
    v(0, (d.height + seat) / 2, -half.z - E.shell / 2),
    { color: "#f2f2f2" },
  );
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: ArchetypeFrame.facing(v(0, seat, half.z), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    width: d.seatWidth,
    depth: d.seatDepth,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createHighChair}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The seat a child sits on (#3468 N13).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mass, which the page does not give, is provisional.
 */
export namespace createHighChair {
  /** The affordance id: `seat`, the seat, facing `+Z`. */
  export type Affordance = "seat";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `depth`: the footprint.
   * - `height`: the chair's top.
   * - `seatHeight`, `seatWidth`, `seatDepth`: the seat.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "depth"
    | "height"
    | "seatHeight"
    | "seatWidth"
    | "seatDepth"
    | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `highChair` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    width: ArchetypeBand.metres(0.56, 0.56, ANTILOP),
    depth: ArchetypeBand.metres(0.59, 0.59, ANTILOP),
    height: ArchetypeBand.metres(0.9, 0.9, ANTILOP),
    seatHeight: ArchetypeBand.metres(0.54, 0.54, ANTILOP),
    seatWidth: ArchetypeBand.metres(0.25, 0.25, ANTILOP),
    seatDepth: ArchetypeBand.metres(0.22, 0.22, ANTILOP),
    mass: ArchetypeBand.of("kg", 2.5, 4, ArchetypeBand.TYPICAL_MASS, true),
  };
}
