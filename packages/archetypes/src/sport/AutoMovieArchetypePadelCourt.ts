import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core/index";

/** Constructs the padel court archetype from its recipe. */
export namespace AutoMovieArchetypePadelCourt {
/**
 * A padel court at the International Padel Federation's dimensions: the playing
 * area 20 m long along Z and 10 m wide along X, divided by a net 88 cm high at
 * its centre, closed at each end by a back wall 3 m high and on each side by a
 * wall 3 m high for the first 2 m from the back wall and 2 m high for the next
 * 2 m. The model's origin is the floor under the net's centre.
 *
 * The walls are the glass a ball is played off; the wire mesh that closes the
 * rest of the sides is not modelled. `net` is the net's top centre, `end` and
 * `far` the middles of the two back walls' feet.
 *
 * @param params The model's id.
 * @param seed The seed; the court has no drawn dimension.
 * @returns The court.
 */
export function create(
  params: AutoMovieArchetypePadelCourt.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypePadelCourt.Affordance, never> {
  const draw: AutoMovieArchetypeDrawSession<never> =
    new AutoMovieArchetypeDrawSession("padelCourt", {}, seed, {});
  const builder: AutoMovieArchetypeBuilder<AutoMovieArchetypePadelCourt.Affordance, never> =
    new AutoMovieArchetypeBuilder({
      material: "glass",
      id: params.id,
      name: "padel court",
      draw,
    });
  const { LENGTH, WIDTH, NET, WALL, STEP } = AutoMovieArchetypePadelCourt;
  const sheet: number = 0.012;
  const end: number = LENGTH / 2;
  builder.box(
    "net",
    Vector3.create(WIDTH, NET, 0.004),
    Vector3.create(0, NET / 2, 0),
    { color: "#202020" },
  );
  for (const z of [-1, 1]) {
    const name: string = z < 0 ? "near" : "far";
    builder.box(
      `${name}BackWall`,
      Vector3.create(WIDTH, WALL, sheet),
      Vector3.create(0, WALL / 2, z * (end + sheet / 2)),
      { color: "#cfe3ea" },
    );
    for (const x of [-1, 1])
      for (const [part, height, from] of [
        ["high", WALL, 0],
        ["low", STEP, 2],
      ] as const)
        builder.box(
          `${name}${x < 0 ? "Left" : "Right"}${part === "high" ? "High" : "Low"}`,
          Vector3.create(sheet, height, 2),
          Vector3.create(
            x * (WIDTH / 2 + sheet / 2),
            height / 2,
            z * (end - from - 1),
          ),
          { color: "#cfe3ea" },
        );
  }
  builder.affordance({
    id: "net",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, NET, 0)),
    extent: null,
  });
  for (const [id, z] of [
    ["end", -end],
    ["far", end],
  ] as const)
    builder.affordance({
      id,
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, z)),
      extent: null,
    });

  // A built court's nominal assembly mass; it never moves.
  return builder.build(8000);
}

  /* Companion types and constants of {@link AutoMovieArchetypePadelCourt.create}. */
  /**
   * `net`, the net's top centre; `end` and `far`, the middles of the two back
   * walls' feet.
   */
  export type Affordance = "net" | "end" | "far";

  /** The parameters. */
  export interface IParams {
    /** The model's id, unique in a scene; `padelCourt` when absent. */
    id?: string;
  }

  /** The playing area's length, metres: FIP Rules of Padel, 20 m. */
  export const LENGTH: number = 20;

  /** The playing area's width, metres: FIP Rules of Padel, 10 m. */
  export const WIDTH: number = 10;

  /** The net's height at its centre, metres: FIP Rules of Padel, 0.88 m. */
  export const NET: number = 0.88;

  /**
   * The back walls' and the first side panels' height, metres: FIP Rules of
   * Padel, 3 m.
   */
  export const WALL: number = 3;

  /** The second side panels' height, metres: FIP Rules of Padel, 2 m. */
  export const STEP: number = 2;
}
