import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/*
 * The pool table read.
 */
const WPA: string =
  "WPA Recommended Equipment Specifications: a 9 ft table's playing surface 100 (+1/8) x 50 (+1/8) in (5); the bed 29 1/4 to 31 in above the floor (2); the cushion's nose 62 1/2 to 64 1/2% of the ball's diameter above the bed (7); rails 4 to 7 1/2 in wide with the cushions (6); balls 2 1/4 in across (16) (https://wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf)";

/*
 * The ball's diameter, metres: WPA 16, 2 1/4 in.
 */
const BALL: number = 2.25 * AutoMovieArchetypeUnits.INCH;

/*
 * Mouth widths at the lower end of WPA §9, metres.
 */
const MOUTH = {
  corner: 4.5 * AutoMovieArchetypeUnits.INCH,
  side: 5 * AutoMovieArchetypeUnits.INCH,
} as const;

/** Canonical producer and authoring contract for CueTable. */
export namespace AutoMovieArchetypeCueTable {
  /**
   * A 9 ft pool table: its bed, the cushions' nose line round it and the rails
   * outside.
   *
   * The table stands on the floor at the origin, its length along `Z` and its
   * width along `X`. `bed` is the playing surface and the four named rail sites
   * lie on the cushion noses. The left and right sites mark their head-side
   * sections. The four corner and two side pockets have open mouths in the rail
   * and bed and a named target at each mouth. Pocket shelves, liners and returns
   * use a coarse open recess.
   *
   * @param params Any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The table.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(
    params: AutoMovieArchetypeCueTable.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeCueTable.Affordance, AutoMovieArchetypeCueTable.Dimension> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeCueTable.Dimension> =
      new AutoMovieArchetypeDrawSession<AutoMovieArchetypeCueTable.Dimension>(
        "cueTable",
        AutoMovieArchetypeCueTable.UNITS,
        seed,
        params,
      );
    const d: Record<AutoMovieArchetypeCueTable.Dimension, number> = draw.dimensions(
      AutoMovieArchetypeCueTable.BANDS,
    );
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCueTable.Affordance,
      AutoMovieArchetypeCueTable.Dimension
    > = new AutoMovieArchetypeBuilder({
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

    // The cabinet's top 9 cm below the bed is authored; no rule states it.
    const drop: number = 0.09;
    const tray: number = bed - drop;
    const edge: number = length / 2 - corner;
    const sideSpan: number = edge - MOUTH.side / 2;
    const sideCenter: number = (edge + MOUTH.side / 2) / 2;
    builder.box(
      "cabinet",
      v(width + 2 * rail, tray, length + 2 * rail),
      v(0, tray / 2, 0),
      { color: "#28352b" },
    );
    builder.box(
      "bed-center",
      v(width - 2 * corner, drop, length),
      v(0, bed - drop / 2, 0),
      { color: "#3b6e3b" },
    );
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        builder.box(
          `bed-side-${sx}-${sz}`,
          v(corner, drop, sideSpan),
          v((sx * (width - corner)) / 2, bed - drop / 2, sz * sideCenter),
          { color: "#3b6e3b" },
        );
        const railId: string = sx === 1 ? "rail-left" : "rail-right";
        builder.box(
          sz === -1 ? railId : `${railId}-foot`,
          v(rail, nose - tray, sideSpan),
          v((sx * (width + rail)) / 2, (nose + tray) / 2, sz * sideCenter),
          { color: "#5a3a22" },
        );
      }
    for (const sz of [-1, 1])
      builder.box(
        sz === -1 ? "rail-head" : "rail-foot",
        v(width - 2 * corner, nose - tray, rail),
        v(0, (nose + tray) / 2, (sz * (length + rail)) / 2),
        { color: "#5a3a22" },
      );

    for (const [id, x, z] of [
      ["headLeftPocket", (width - corner) / 2, -(length - corner) / 2],
      ["headRightPocket", -(width - corner) / 2, -(length - corner) / 2],
      ["leftPocket", width / 2, 0],
      ["rightPocket", -width / 2, 0],
      ["footLeftPocket", (width - corner) / 2, (length - corner) / 2],
      ["footRightPocket", -(width - corner) / 2, (length - corner) / 2],
    ] as const)
      builder.affordance({
        id,
        kind: "socket",
        frame: AutoMovieArchetypeFrame.upright(v(x, bed, z)),
        extent: null,
      });
    builder.affordance({
      id: "bed",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, bed, 0)),
      extent: null,
      width,
      depth: length,
    });
    for (const [id, x, z, center, span] of [
      ["leftRail", 1, 0, -sideCenter, sideSpan],
      ["rightRail", -1, 0, -sideCenter, sideSpan],
      ["headRail", 0, -1, -length / 2, width - 2 * corner],
      ["footRail", 0, 1, length / 2, width - 2 * corner],
    ] as const)
      builder.affordance({
        id,
        kind: "ledge",
        frame: AutoMovieArchetypeFrame.facing(
          v((x * width) / 2, nose, center),
          v(0, 1, 0),
          v(z, 0, -x),
        ),
        extent: null,
        length: span,
      });
    return builder.build(d.mass);
  }
  /**
   * The affordance ids:
   *
   * - `bed`: the playing surface.
   * - `headRail`, `footRail`, `leftRail`, `rightRail`: the cushions' nose lines
   *   on `-Z`, `+Z`, `+X` and `-X`, ledges, each `+Z` out from the bed. The
   *   side sites cover the sections nearest the head rail.
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
   * - `nose`: the cushion's nose above the bed, as a share of the ball's
   *   diameter.
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
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
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
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.metres(
      50 * AutoMovieArchetypeUnits.INCH,
      50.125 * AutoMovieArchetypeUnits.INCH,
      WPA,
    ),
    length: AutoMovieArchetypeBand.metres(
      100 * AutoMovieArchetypeUnits.INCH,
      100.125 * AutoMovieArchetypeUnits.INCH,
      WPA,
    ),
    height: AutoMovieArchetypeBand.metres(
      29.25 * AutoMovieArchetypeUnits.INCH,
      31 * AutoMovieArchetypeUnits.INCH,
      WPA,
    ),
    nose: AutoMovieArchetypeBand.of("", 0.625, 0.645, WPA),
    rail: AutoMovieArchetypeBand.metres(
      4 * AutoMovieArchetypeUnits.INCH,
      7.5 * AutoMovieArchetypeUnits.INCH,
      WPA,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      300,
      450,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
