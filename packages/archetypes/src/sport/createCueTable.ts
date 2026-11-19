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

/** The pool table read. */
const WPA: string =
  "WPA Recommended Equipment Specifications: a 9 ft table's playing surface 100 (+1/8) x 50 (+1/8) in (5); the bed 29 1/4 to 31 in above the floor (2); the cushion's nose 62 1/2 to 64 1/2% of the ball's diameter above the bed (7); rails 4 to 7 1/2 in wide with the cushions (6); balls 2 1/4 in across (16) (https://wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf)";

/** The ball's diameter, metres: WPA 16, 2 1/4 in. */
const BALL: number = 2.25 * ArchetypeUnits.INCH;

/** Mouth widths at the lower end of WPA §9, metres. */
const MOUTH = { corner: 4.5 * ArchetypeUnits.INCH, side: 5 * ArchetypeUnits.INCH } as const;

/**
 * A 9 ft pool table: its bed, the cushions' nose line round it and the rails outside.
 *
 * The table stands on the floor at the origin, its length along `Z` and its width along `X`. `bed` is the playing surface and `headRail`, `footRail`, `leftRail` and `rightRail` are the cushion nose lines at the `-Z`, `+Z`, `+X` and `-X` ends. The four corner and two side pockets have open mouths in the rail and bed and a named target at each mouth. Pocket shelves, liners and returns use a coarse open recess.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The table.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the table stands, its contacts, and what is left out with why.
 * @evidence contracts/development/implementation.md#principled-implementation The WPA's playing surface, bed height, nose height as its share of the ball's diameter and rail width.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, split the bounded bed and rails around each pocket, then record their aiming and support affordances.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rail caps are level with their cushion noses. Box cuts approximate pocket jaws and preserve open physical mouths at the WPA widths.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed number of regions per table.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCueTable(
  params: createCueTable.IParams = {},
  seed?: number | string,
): Archetype<createCueTable.Affordance, createCueTable.Dimension> {
  const draw: ArchetypeDrawSession<createCueTable.Dimension> =
    new ArchetypeDrawSession<createCueTable.Dimension>(
      "cueTable",
      createCueTable.UNITS,
      seed,
      params,
    );
  const d: Record<createCueTable.Dimension, number> = draw.dimensions(
    createCueTable.BANDS,
  );
  const builder: ArchetypeBuilder<
    createCueTable.Affordance,
    createCueTable.Dimension
  > = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "pool table",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const width: number = d.width;
  const length: number = d.length;
  const bed: number = d.height;
  const nose: number = bed + d.nose * BALL;
  const rail: number = d.rail;
  const corner: number = MOUTH.corner / Math.SQRT2;
  const drop: number = 0.09;
  const tray: number = bed - drop;
  const edge: number = length / 2 - corner;
  const sideSpan: number = edge - MOUTH.side / 2;
  const sideCenter: number = (edge + MOUTH.side / 2) / 2;
  builder.box("cabinet", v(width + 2 * rail, tray, length + 2 * rail), v(0, tray / 2, 0), { color: "#28352b" });
  builder.box("bed-center", v(width - 2 * corner, drop, length), v(0, bed - drop / 2, 0), { color: "#3b6e3b" });
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      builder.box(`bed-side-${sx}-${sz}`, v(corner, drop, sideSpan), v(sx * (width - corner) / 2, bed - drop / 2, sz * sideCenter), { color: "#3b6e3b" });
      const railId: string = sx === 1 ? "rail-left" : "rail-right";
      builder.box(sz === -1 ? railId : `${railId}-foot`, v(rail, nose - tray, sideSpan), v(sx * (width + rail) / 2, (nose + tray) / 2, sz * sideCenter), { color: "#5a3a22" });
    }
  for (const sz of [-1, 1])
    builder.box(sz === -1 ? "rail-head" : "rail-foot", v(width - 2 * corner, nose - tray, rail), v(0, (nose + tray) / 2, sz * (length + rail) / 2), { color: "#5a3a22" });

  for (const [id, x, z] of [
    ["headLeftPocket", (width - corner) / 2, -(length - corner) / 2],
    ["headRightPocket", -(width - corner) / 2, -(length - corner) / 2],
    ["leftPocket", width / 2, 0],
    ["rightPocket", -width / 2, 0],
    ["footLeftPocket", (width - corner) / 2, (length - corner) / 2],
    ["footRightPocket", -(width - corner) / 2, (length - corner) / 2],
  ] as const)
    builder.affordance({ id, kind: "socket", frame: ArchetypeFrame.upright(v(x, bed, z)), extent: null });
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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Pocket mouths use WPA diameters and remain distinct from the bed and rail hand targets.
 */
export namespace createCueTable {
  /**
   * The affordance ids:
   *
   * - `bed`: the playing surface.
   * - `headRail`, `footRail`, `leftRail`, `rightRail`: the cushions' nose lines on `-Z`, `+Z`, `+X` and `-X`, ledges, each `+Z` out from the bed.
   * - The six `Pocket` points are the open mouth centres at the bed's height.
   */
  export type Affordance =
    | "bed"
    | "headRail"
    | "footRail"
    | "leftRail"
    | "rightRail"
    | "headLeftPocket"
    | "headRightPocket"
    | "leftPocket"
    | "rightPocket"
    | "footLeftPocket"
    | "footRightPocket";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `length`: the playing surface.
   * - `height`: the bed above the floor.
   * - `nose`: the cushion's nose above the bed, as a share of the ball's diameter.
   * - `rail`: a rail's width with its cushion.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "length"
    | "height"
    | "nose"
    | "rail"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    length: "m",
    height: "m",
    nose: "",
    rail: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `cueTable` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    width: ArchetypeBand.metres(
      50 * ArchetypeUnits.INCH,
      50.125 * ArchetypeUnits.INCH,
      WPA,
    ),
    length: ArchetypeBand.metres(
      100 * ArchetypeUnits.INCH,
      100.125 * ArchetypeUnits.INCH,
      WPA,
    ),
    height: ArchetypeBand.metres(
      29.25 * ArchetypeUnits.INCH,
      31 * ArchetypeUnits.INCH,
      WPA,
    ),
    nose: ArchetypeBand.of("", 0.625, 0.645, WPA),
    rail: ArchetypeBand.metres(
      4 * ArchetypeUnits.INCH,
      7.5 * ArchetypeUnits.INCH,
      WPA,
    ),
    mass: ArchetypeBand.of("kg", 300, 450, ArchetypeBand.TYPICAL_MASS, true),
  };
}
