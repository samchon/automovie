import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core";

/** Constructs the ten-pin bowling lane from its recipe. */
export namespace AutoMovieArchetypeBowlingLane {
  /**
   * A ten-pin lane with the foul line at Z=0, the approach along −Z and the first
   * pin 60 ft along +Z.
   *
   * @param params Optional lane id.
   * @param seed Seed for permitted lane width.
   * @returns A coarse lane, lowered gutters, foul line and ten pin sockets.
   */
  export function create(
    params: AutoMovieArchetypeBowlingLane.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeBowlingLane.Affordance, "width"> {
    const inch: number = AutoMovieArchetypeUnits.INCH;
    const draw: AutoMovieArchetypeDrawSession<"width"> =
      new AutoMovieArchetypeDrawSession("bowlingLane", { width: "m" }, seed, {});
    const { width }: Record<"width", number> = draw.dimensions({
      width: AutoMovieArchetypeBand.metres(
        41 * inch,
        42 * inch,
        "USBC Equipment Specifications, lane width 41.5 ± 0.5 in",
      ),
    });
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeBowlingLane.Affordance,
      "width"
    > = new AutoMovieArchetypeBuilder({
      material: "wood",
      id: params.id,
      name: "ten-pin bowling lane",
      draw,
    });
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
    const spacing: number = 12 * inch;
    const head: number = 60 * spacing;
    const length: number = head + 34.1875 * inch;
    const approach: number = 15 * spacing;
    const line: number = inch;
    const thick: number = 0.08;
    const gutter: number = 9.25 * inch;
    builder.box(
      "approach",
      v(width + 2 * gutter, thick, approach - line),
      v(0, -thick / 2, -(approach + line) / 2),
      { color: "#b68b52" },
    );
    builder.box(
      "foulLine",
      v(width + 2 * gutter, thick, line),
      v(0, -thick / 2, -line / 2),
      { color: "#24201e" },
    );
    builder.box("lane", v(width, thick, length), v(0, -thick / 2, length / 2), {
      color: "#d8ad67",
    });
    for (const [id, side] of [
      ["leftGutter", 1],
      ["rightGutter", -1],
    ] as const) {
      const x: number = (side * (width + gutter)) / 2;
      builder.box(
        id,
        v(gutter, thick, length),
        v(x, -0.11 - thick / 2, length / 2),
        { color: "#51555b" },
      );
      builder.affordance({
        id,
        kind: "surface",
        frame: AutoMovieArchetypeFrame.upright(v(x, -0.11, length / 2)),
        extent: null,
        width: gutter,
        depth: length,
      });
    }
    builder.affordance({
      id: "approach",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, 0, -approach / 2)),
      extent: null,
      width: width + 2 * gutter,
      depth: approach,
    });
    builder.affordance({
      id: "lane",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, 0, length / 2)),
      extent: null,
      width,
      depth: length,
    });
    builder.affordance({
      id: "foulLine",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, 0, 1), v(1, 0, 0)),
      extent: null,
    });
    for (let row: number = 0; row < 4; ++row)
      for (let column: number = 0; column <= row; ++column) {
        const index: number = (row * (row + 1)) / 2 + column;
        const id: AutoMovieArchetypeBowlingLane.Pin = AutoMovieArchetypeBowlingLane.PINS[index]!;
        const point: ReturnType<typeof v> = v(
          (row / 2 - column) * spacing,
          0,
          head + (row * spacing * Math.sqrt(3)) / 2,
        );
        builder.rod(id, 1.125 * inch, { ...point, y: -0.001 }, point, {
          color: "#7a5d39",
        });
        builder.affordance({
          id,
          kind: "socket",
          frame: AutoMovieArchetypeFrame.upright(point),
          extent: null,
        });
      }
    // A fixed lane uses a nominal assembly mass, independent of pin mass.
    return builder.build(1000);
  }

  /*
   * Authorable settings and local support and aim targets of the ten-pin lane. Pin sockets are numbered
   * from the headpin to the last row, which gives each separately placed pin its
   * own origin.
   */
  /**
   * Pin spots numbered in order by row from left to right as seen by the
   * bowler.
   */
  export const PINS = [
    "pin1",
    "pin2",
    "pin3",
    "pin4",
    "pin5",
    "pin6",
    "pin7",
    "pin8",
    "pin9",
    "pin10",
  ] as const;

  /** The socket of a single pin spot. */
  export type Pin = (typeof PINS)[number];

  /** Named surfaces, foul-line datum and pin positions. */
  export type Affordance =
    | "approach"
    | "lane"
    | "leftGutter"
    | "rightGutter"
    | "foulLine"
    | Pin;

  /** Parameters accepted by this producer. */
  export interface IParams {
    /** Optional lane id; `bowlingLane` when absent. */
    id?: string;
  }
}
