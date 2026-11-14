import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Metres in an inch. */
const INCH: number = 0.0254;

/** The pool table read. */
const WPA: string =
  "WPA Recommended Equipment Specifications: a 9 ft table's playing surface 100 (+1/8) x 50 (+1/8) in (5); the bed 29 1/4 to 31 in above the floor (2); the cushion's nose 62 1/2 to 64 1/2% of the ball's diameter above the bed (7); rails 4 to 7 1/2 in wide with the cushions (6); balls 2 1/4 in across (16) (https://wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf)";

/** The ball's diameter, metres: WPA 16, 2 1/4 in. */
const BALL: number = 2.25 * INCH;

/**
 * A 9 ft pool table: its bed, the cushions' nose line round it and the rails outside.
 *
 * The table stands on the floor at the origin, its length along `Z` and its width along `X`. Its cabinet fills the space under the bed; the rails stand round the bed as wide as the drawn rail width, their caps drawn level with the cushions' nose. `bed` is the playing surface, where the balls lie and the bridge hand rests; `headRail`, `footRail`, `leftRail` and `rightRail` are the cushions' nose lines at the `-Z`, `+Z`, `+X` and `-X` ends, ledges a hand or a cue rests on. The pockets are not cut, and the cue is not modelled, since no source read gives its length beyond the 40 in least.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The table.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the table stands, its contacts, and what is left out with why.
 * @evidence contracts/development/implementation.md#principled-implementation The WPA's playing surface, bed height, nose height as its share of the ball's diameter and rail width.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the cabinet, the four rails, then the five contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pockets, legs or cloth; a rail's cap is level with the nose.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Five parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCueTable(
  params: createCueTable.IParams = {},
  seed?: number | string,
): Archetype<createCueTable.Affordance, createCueTable.Dimension> {
  const d: Record<createCueTable.Dimension, number> = ArchetypeDraw.dimensions(
    "cueTable",
    createCueTable.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createCueTable.Affordance,
    createCueTable.Dimension
  > = new ArchetypeBuilder({
    archetype: "cueTable",
    id: params.id,
    name: "pool table",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const width: number = d.width;
  const length: number = d.length;
  const bed: number = d.height;
  const nose: number = bed + d.nose * BALL;
  const rail: number = d.rail;
  builder.box("cabinet", v(width, bed, length), v(0, bed / 2, 0), {
    color: "#3b6e3b",
  });
  for (const [id, sx, sz, sizeX, sizeZ] of [
    ["rail-left", 1, 0, rail, length + 2 * rail],
    ["rail-right", -1, 0, rail, length + 2 * rail],
    ["rail-head", 0, -1, width, rail],
    ["rail-foot", 0, 1, width, rail],
  ] as const)
    builder.box(
      id,
      v(sizeX, nose, sizeZ),
      v(sx * (width / 2 + rail / 2), nose / 2, sz * (length / 2 + rail / 2)),
      { color: "#5a3a22" },
    );
  builder.affordance({
    id: "bed",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, bed, 0)),
    extent: null,
    width,
    depth: length,
  });
  for (const [id, x, z, span] of [
    ["leftRail", 1, 0, length],
    ["rightRail", -1, 0, length],
    ["headRail", 0, -1, width],
    ["footRail", 0, 1, width],
  ] as const)
    builder.affordance({
      id,
      kind: "ledge",
      frame: ArchetypeFrame.facing(
        v((x * width) / 2, nose, (z * length) / 2),
        v(0, 1, 0),
        v(z, 0, -x),
      ),
      extent: null,
      length: span,
    });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createCueTable}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension; the nose height as the rule's share of the ball's diameter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bed a shot is played on and the rails a bridge rests on (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts What no source places, the pockets' cut and the cue's length, is left out.
 */
export namespace createCueTable {
  /**
   * The affordance ids:
   *
   * - `bed`: the playing surface.
   * - `headRail`, `footRail`, `leftRail`, `rightRail`: the cushions' nose lines on `-Z`, `+Z`, `+X` and `-X`, ledges, each `+Z` out from the bed.
   */
  export type Affordance =
    | "bed"
    | "headRail"
    | "footRail"
    | "leftRail"
    | "rightRail";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `length`: the playing surface.
   * - `height`: the bed above the floor.
   * - `nose`: the cushion's nose above the bed, as a share of the ball's diameter.
   * - `rail`: a rail's width with its cushion.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "length" | "height" | "nose" | "rail" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `cueTable` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    width: ArchetypeBand.metres(50 * INCH, 50.125 * INCH, WPA),
    length: ArchetypeBand.metres(100 * INCH, 100.125 * INCH, WPA),
    height: ArchetypeBand.metres(29.25 * INCH, 31 * INCH, WPA),
    nose: ArchetypeBand.of("", 0.625, 0.645, WPA),
    rail: ArchetypeBand.metres(4 * INCH, 7.5 * INCH, WPA),
    mass: ArchetypeBand.of("kg", 300, 450, ArchetypeBand.TYPICAL_MASS, true),
  };
}
