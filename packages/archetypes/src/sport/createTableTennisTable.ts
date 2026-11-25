import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/**
 * A table tennis table at the ITTF Laws' dimensions: the playing surface 2.74 m
 * long along Z and 1.525 m wide along X, lying 76 cm above the floor (Law
 * 2.1.1), with a net 15.25 cm high across its middle whose posts stand 15.25 cm
 * outside the side lines (Law 2.2.2), on four legs. The model's origin is the
 * floor under the net's centre.
 *
 * `surface` is the playing surface's centre, `net` the top of the net's centre,
 * and `end` and `far` the middles of the two end lines, where a server stands
 * behind and a receiver faces.
 *
 * @param params The model's id.
 * @param seed The seed; the table has no drawn dimension.
 * @returns The table.
 */
export function createTableTennisTable(
  params: createTableTennisTable.IParams = {},
  seed?: number,
): AutoMovieArchetype<createTableTennisTable.Affordance, never> {
  const draw: AutoMovieArchetypeDrawSession<never> =
    new AutoMovieArchetypeDrawSession("tableTennisTable", {}, seed, {});
  const builder: AutoMovieArchetypeBuilder<
    createTableTennisTable.Affordance,
    never
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "table tennis table",
    draw,
  });
  const { LENGTH, WIDTH, HEIGHT, NET } = createTableTennisTable;
  const top: number = 0.025;
  const leg: number = 0.05;
  builder.box(
    "top",
    Vector3.create(WIDTH, top, LENGTH),
    Vector3.create(0, HEIGHT - top / 2, 0),
    { color: "#1d4f8f" },
  );
  builder.box(
    "net",
    Vector3.create(WIDTH + 2 * NET, NET, 0.004),
    Vector3.create(0, HEIGHT + NET / 2, 0),
    { color: "#f2f2f2" },
  );
  for (const x of [-1, 1])
    for (const z of [-1, 1])
      builder.box(
        `leg-${x < 0 ? "left" : "right"}-${z < 0 ? "near" : "far"}`,
        Vector3.create(leg, HEIGHT - top, leg),
        Vector3.create(
          x * (WIDTH / 2 - 2 * leg),
          (HEIGHT - top) / 2,
          z * (LENGTH / 2 - 2 * leg),
        ),
        { color: "#2b2b2b" },
      );
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, HEIGHT, 0)),
    extent: null,
    width: WIDTH,
    depth: LENGTH,
  });
  builder.affordance({
    id: "net",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, HEIGHT + NET, 0)),
    extent: null,
  });
  for (const [id, z] of [
    ["end", -LENGTH / 2],
    ["far", LENGTH / 2],
  ] as const)
    builder.affordance({
      id,
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, HEIGHT, z)),
      extent: null,
    });

  // A competition table's assembly mass, nominal; it never moves.
  return builder.build(130);
}

/** Companion types and constants of {@link createTableTennisTable}. */
export namespace createTableTennisTable {
  /**
   * `surface`, the playing surface's centre; `net`, the net's top centre; `end`
   * and `far`, the middles of the two end lines.
   */
  export type Affordance = "surface" | "net" | "end" | "far";

  /** The parameters. */
  export interface IParams {
    /** The model's id, unique in a scene; `tableTennisTable` when absent. */
    id?: string;
  }

  /** The playing surface's length, metres: ITTF Law 2.1.1, 2.74 m. */
  export const LENGTH: number = 2.74;

  /** The playing surface's width, metres: ITTF Law 2.1.1, 1.525 m. */
  export const WIDTH: number = 1.525;

  /**
   * The playing surface's height above the floor, metres: ITTF Law 2.1.1, 76
   * cm.
   */
  export const HEIGHT: number = 0.76;

  /**
   * The net's height above the playing surface, and its posts' reach outside
   * the side lines, metres: ITTF Law 2.2.2, 15.25 cm.
   */
  export const NET: number = 0.1525;
}
