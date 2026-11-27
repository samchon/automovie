import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core/index";

/** Constructs the squash court archetype from its recipe. */
export namespace AutoMovieArchetypeSquashCourt {
/**
 * A singles squash court at the World Squash Federation's dimensions: the floor
 * 9.75 m long along Z and 6.4 m wide along X, the front wall at +Z standing to
 * its 4.57 m out line, the side walls falling from it to the back wall's 2.13 m
 * out line, and the tin's top 48 cm above the floor across the front wall. The
 * model's origin is the floor's centre.
 *
 * A ball is out above a wall's out line, so the walls stand to their lines:
 * what they return is in play. `front`, `back` and `tin` are the walls' and the
 * tin's centres on their faces, `t` the floor's short-line centre a rally
 * returns to.
 *
 * @param params The model's id.
 * @param seed The seed; the court has no drawn dimension.
 * @returns The court.
 */
export function create(
  params: AutoMovieArchetypeSquashCourt.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSquashCourt.Affordance, never> {
  const draw: AutoMovieArchetypeDrawSession<never> =
    new AutoMovieArchetypeDrawSession("squashCourt", {}, seed, {});
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSquashCourt.Affordance,
    never
  > = new AutoMovieArchetypeBuilder({
    material: "concrete",
    id: params.id,
    name: "squash court",
    draw,
  });
  const { LENGTH, WIDTH, FRONT, BACK, TIN, SHORT } = AutoMovieArchetypeSquashCourt;
  const wall: number = 0.1;
  const front: number = LENGTH / 2;
  builder.box(
    "frontWall",
    Vector3.create(WIDTH + 2 * wall, FRONT, wall),
    Vector3.create(0, FRONT / 2, front + wall / 2),
    { color: "#f4f4f0" },
  );
  builder.box(
    "backWall",
    Vector3.create(WIDTH + 2 * wall, BACK, wall),
    Vector3.create(0, BACK / 2, -front - wall / 2),
    { color: "#f4f4f0" },
  );
  for (const side of [-1, 1]) {
    const inner: number = (side * WIDTH) / 2;
    const outer: number = side * (WIDTH / 2 + wall);
    builder.convex(
      side < 0 ? "leftWall" : "rightWall",
      [inner, outer].flatMap((x: number): IAutoMovieVector3[] => [
        Vector3.create(x, 0, -front),
        Vector3.create(x, BACK, -front),
        Vector3.create(x, 0, front),
        Vector3.create(x, FRONT, front),
      ]),
      undefined,
      { color: "#f4f4f0" },
    );
  }
  builder.box(
    "tin",
    Vector3.create(WIDTH, TIN, 0.02),
    Vector3.create(0, TIN / 2, front - 0.01),
    { color: "#c0392b" },
  );
  for (const [id, y, z] of [
    ["front", FRONT / 2, front],
    ["back", BACK / 2, -front],
    ["tin", TIN, front],
    ["t", 0, front - SHORT],
  ] as const)
    builder.affordance({
      id,
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, y, z)),
      extent: null,
    });

  // A built court's nominal assembly mass; it never moves.
  return builder.build(20000);
}

  /* Companion types and constants of {@link AutoMovieArchetypeSquashCourt.create}. */
  /**
   * `front` and `back`, the walls' centres; `tin`, the tin's top centre; `t`,
   * the short line's centre on the floor.
   */
  export type Affordance = "front" | "back" | "tin" | "t";

  /** The parameters. */
  export interface IParams {
    /** The model's id, unique in a scene; `squashCourt` when absent. */
    id?: string;
  }

  /** The floor's length, metres: WSF singles court, 9750 mm. */
  export const LENGTH: number = 9.75;

  /** The floor's width, metres: WSF singles court, 6400 mm. */
  export const WIDTH: number = 6.4;

  /** The front wall's out line, metres: WSF, 4570 mm. */
  export const FRONT: number = 4.57;

  /** The back wall's out line, metres: WSF, 2130 mm. */
  export const BACK: number = 2.13;

  /** The tin's top, metres: WSF, 480 mm. */
  export const TIN: number = 0.48;

  /** The short line's distance from the front wall, metres: WSF, 5440 mm. */
  export const SHORT: number = 5.44;
}
