import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../core";
import { GoalBuild } from "./GoalBuild";
import type { createGoal } from "./createGoal";

/** The builder for this field or court apparatus. */
type Builder = AutoMovieArchetypeBuilder<
  createVolleyballNet.Affordance,
  createGoal.Dimension
>;

/** The saved goal dimensions in their local units. */
type Drawn = Partial<Record<createGoal.Dimension, number>>;

/** Local points in metres. */
const v: typeof Vector3.create = Vector3.create;

/**
 * The half side line spacing of a volleyball court, metres: the net's side
 * bands 9 m apart (FIVB 2.2, its 9.50 m less two 25 cm).
 */
const VOLLEYBALL_SIDE: number = 4.5;

/**
 * How far a volleyball antenna stands above the net, metres: FIVB 2.4, its top
 * 80 cm; it reaches the net's lower edge below.
 */
const ANTENNA_ABOVE: number = 0.8;

/** The shape of {@link ESTIMATES}. */
interface IEstimates {
  /** The `post` entry. */
  post: number;

  /** The `mesh` entry. */
  mesh: number;

  /** The `antenna` entry. */
  antenna: number;
}

/**
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `post`, a volleyball post's diameter; `mesh`, a
 * net's thickness; `antenna`, half of FIVB's 10 mm antenna.
 */
const ESTIMATES: Readonly<IEstimates> = {
  post: 0.1,
  mesh: 0.005,
  antenna: 0.005,
};

/**
 * A volleyball net with class-specific height, side antennas and post grips.
 *
 * The net extends along X. Top marks its upper edge and its two posts stand on
 * the floor.
 *
 * @param params The identifier, net class and optional dimensions. The class
 *   supplies the top height.
 * @param seed The seed draws the class and free dimensions. Without a seed, the
 *   men's class and band midpoints apply.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createVolleyballNet(
  params: createVolleyballNet.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createVolleyballNet.Affordance,
  createVolleyballNet.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<typeof GoalBuild.draw<createVolleyballNet.Affordance>> =
    GoalBuild.draw("volleyballNet", params, seed);
  volleyball(builder, d);
  return builder.build(d.mass!);
}

/**
 * Build a volleyball net: the posts outside the side lines, the net hung from
 * its top at the drawn height with its top band, and an antenna over each side
 * line; `top` is the net's top, a ledge along `X`, and the posts are bars.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 */
function volleyball(builder: Builder, d: Drawn): void {
  const top: number = d.height!;
  const depth: number = d.board!;
  const x: number = VOLLEYBALL_SIDE + d.offset!;
  for (const [id, sign] of [
    ["post-left", 1],
    ["post-right", -1],
  ] as const)
    builder.rod(
      id,
      ESTIMATES.post / 2,
      v(sign * x, 0, 0),
      v(sign * x, d.post!, 0),
      {
        color: "#d0d4d8",
      },
    );
  builder.box(
    "net",
    v(d.width!, depth, ESTIMATES.mesh),
    v(0, top - depth / 2, 0),
    {
      color: "#1d1d1d",
      density: 0.05,
    },
  );
  for (const [id, sign] of [
    ["antenna-left", 1],
    ["antenna-right", -1],
  ] as const)
    builder.rod(
      id,
      ESTIMATES.antenna,
      v(sign * VOLLEYBALL_SIDE, top - depth, 0),
      v(sign * VOLLEYBALL_SIDE, top + ANTENNA_ABOVE, 0),
      { color: "#e53935" },
    );
  builder.affordance({
    id: "top",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(v(0, top, 0), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    length: d.width!,
  });
  GoalBuild.posts(builder, x, d.post!);
}

/** The authored parameters and contact names for {@link createVolleyballNet}. */
export namespace createVolleyballNet {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "board"
    | "height"
    | "mass"
    | "offset"
    | "post"
    | "width";

  /** The contact identifiers for the apparatus. */
  export type Affordance = "leftPost" | "rightPost" | "top";

  /** The identifier and overrides that apply to this profile. */
  export type IParams = Pick<
    createGoal.IParams,
    "id" | "width" | "board" | "offset" | "post" | "mass" | "net"
  >;
}
