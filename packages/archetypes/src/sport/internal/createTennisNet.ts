import type { AutoMovieArchetypeTennisNet } from "../AutoMovieArchetypeTennisNet";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import { GoalBuild } from "./GoalBuild";
import { buildTennisNet } from "./buildTennisNet";
import type { AutoMovieArchetypeGoal } from "../AutoMovieArchetypeGoal";

/**
 * A tennis net with centre strap, sagging cord and post grips.
 *
 * The net spans the XY plane, with the top ledge at the centre strap and the
 * square posts outside the doubles court.
 *
 * @param params The optional identifier and dimensions fixed within their
 *   recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a
 *   seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createTennisNet(
  params: AutoMovieArchetypeTennisNet.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeTennisNet.Affordance, AutoMovieArchetypeTennisNet.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GoalBuild.draw<AutoMovieArchetypeTennisNet.Affordance>> =
    GoalBuild.draw("tennisNet", params, seed);
  tennis(builder, d);
  return builder.build(d.mass!);
}

/** The builder for this field or court apparatus. */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeTennisNet.Affordance,
  AutoMovieArchetypeGoal.Dimension
>;

/** The saved goal dimensions in their local units. */
type Drawn = Partial<Record<AutoMovieArchetypeGoal.Dimension, number>>;

/** Local points in metres. */
const v: typeof Vector3.create = Vector3.create;

/**
 * How far a tennis post may stand above the net cord, metres: ITF Rule 1, 2.5
 * cm, the limit the model takes.
 */
const POST_ABOVE: number = 0.025;

/**
 * The tennis net cord's diameter, metres: ITF Rule 1, at most 0.8 cm, the limit
 * the model takes.
 */
const CORD: number = 0.008;

/**
 * The width of the tennis net's centre strap, metres: ITF Rule 1, at most 5 cm,
 * the limit the model takes.
 */
const STRAP: number = 0.05;
/** Thickness in metres of the retained collision panels. */
const NET_THICKNESS: number = 0.005;

/**
 * Build a tennis net: square posts outside the doubles court, the cord sagging
 * from the posts' height to the centre's, and the net under it; `top` is the
 * net's lowest point at the centre strap, a ledge along `X`, and the posts are
 * bars.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 */
function tennis(builder: Builder, d: Drawn): void {
  const x: number = d.width! / 2 + d.offset!;
  const bar: number = d.bar!;
  const tall: number = d.post! + POST_ABOVE;
  const centre: number = d.height!;
  const post: number = d.post!;
  for (const [id, sign] of [
    ["post-left", 1],
    ["post-right", -1],
  ] as const) {
    builder.box(id, v(bar, tall, bar), v(sign * x, tall / 2, 0), {
      color: "#2e5d3a",
    });
    builder.rod(
      `cord-${id === "post-left" ? "left" : "right"}`,
      CORD / 2,
      v(sign * x, post, 0),
      v(0, centre, 0),
      { color: "#f7f7f7" },
    );
    // These original solid panels retain ball collision and mass behind the open lattice.
    builder.box(
      `net-${id === "post-left" ? "left" : "right"}`,
      v(x, centre, NET_THICKNESS),
      v((sign * x) / 2, centre / 2, 0),
      { color: "#1d1d1d", density: 0.05, opacity: 0 },
    );
  }
  const net: { twine: IAutoMovieMesh; tape: IAutoMovieMesh } = buildTennisNet(
    x,
    centre,
    post,
    CORD,
    STRAP,
  );
  const origin: ReturnType<typeof v> = v(0, 0, 0);
  builder.visualMesh("net-twine", net.twine, origin, { color: "#1d1d1d" });
  builder.visualMesh("net-tape", net.tape, origin, { color: "#f7f7f7" });
  builder.affordance({
    id: "top",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, centre, 0),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    length: STRAP,
  });
  GoalBuild.posts(builder, x, tall, bar);
}
