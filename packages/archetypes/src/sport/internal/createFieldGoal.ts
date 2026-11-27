import { AutoMovieArchetypeFieldGoal } from "../AutoMovieArchetypeFieldGoal";
import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import { GoalBuild } from "./GoalBuild";
import type { AutoMovieArchetypeGoal } from "../AutoMovieArchetypeGoal";

/**
 * A rectangular field, court or ice goal with a scoring opening.
 *
 * Two posts and a crossbar stand in the XY plane. The field faces +Z, and mouth
 * marks the scoring aperture.
 *
 * @param params The optional identifier and dimensions fixed within their
 *   recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a
 *   seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createFieldGoal(
  params: AutoMovieArchetypeFieldGoal.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeFieldGoal.Affordance, AutoMovieArchetypeFieldGoal.Dimension> {
  const kind: AutoMovieArchetypeFieldGoal.Kind = ArchetypeDraw.choice(
    "goal",
    "kind",
    params.kind === undefined ? "footballGoal" : params.kind,
    AutoMovieArchetypeFieldGoal.KINDS,
  );

  const {
    builder,
    d,
  }: ReturnType<typeof GoalBuild.draw<AutoMovieArchetypeFieldGoal.Affordance>> =
    GoalBuild.draw(kind, params, seed);
  rectangularGoal(
    builder,
    d,
    kind === "iceHockeyGoal" || kind === "lacrosseGoal",
  );
  return builder.build(d.mass!);
}

/** The builder for this field or court apparatus. */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeFieldGoal.Affordance,
  AutoMovieArchetypeGoal.Dimension
>;

/** The saved goal dimensions in their local units. */
type Drawn = Partial<Record<AutoMovieArchetypeGoal.Dimension, number>>;

/** Local points in metres. */
const v: typeof Vector3.create = Vector3.create;

/**
 * Build two posts and a crossbar around the scoring opening. Field goals and
 * handball use square sections, while ice hockey and lacrosse use pipes. The
 * mouth lies in the goal plane.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 * @param round Whether the frame uses pipes.
 */
function rectangularGoal(builder: Builder, d: Drawn, round: boolean): void {
  const half: number = d.width! / 2;
  const height: number = d.height!;
  const bar: number = d.bar!;
  const x: number = half + bar / 2;
  const color: string = round ? "#d53635" : "#f7f7f7";
  for (const [id, sign] of [
    ["post-left", 1],
    ["post-right", -1],
  ] as const) {
    if (round)
      builder.rod(
        id,
        bar / 2,
        v(sign * x, 0, 0),
        v(sign * x, height + bar / 2, 0),
        { color },
      );
    else
      builder.box(
        id,
        v(bar, height + bar, bar),
        v(sign * x, (height + bar) / 2, 0),
        { color },
      );
  }
  if (round)
    builder.rod(
      "crossbar",
      bar / 2,
      v(-x, height + bar / 2, 0),
      v(x, height + bar / 2, 0),
      { color },
    );
  else
    builder.box(
      "crossbar",
      v(d.width! + 2 * bar, bar, bar),
      v(0, height + bar / 2, 0),
      { color },
    );
  builder.affordance({
    id: "crossbar",
    kind: "bar",
    symmetry: round ? "round" : "half",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, height + bar / 2, 0),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: bar,
    length: d.width! + 2 * bar,
  });
  GoalBuild.posts(builder, x, height, bar);
  builder.affordance({
    id: "mouth",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: d.width!,
    height,
  });
}
