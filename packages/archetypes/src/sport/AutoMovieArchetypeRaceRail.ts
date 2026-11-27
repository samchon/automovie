import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeOval,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/*
 * No source read gives the rail's height, its posts' spacing or a turn's
 * radius: estimates.
 */
const ESTIMATE: string = "an estimate, no source read gives it";

/** Constructs the race rail archetype from its recipe. */
export namespace AutoMovieArchetypeRaceRail {
/**
 * A racecourse's inner rail round an oval (`AutoMovieArchetypeOval`): a top
 * rail on posts, laid along the rail line every post spacing, the infield on
 * the runners' left as they run counter-clockwise.
 *
 * The oval's infield middle is the origin and its home straight runs toward
 * `+Z` on the `-X` side. `start` is the rail at the home straight's start,
 * facing the running direction.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every free dimension inside its band; absent,
 *   the middle of each band.
 * @returns The rail.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeRaceRail.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRaceRail.Affordance, AutoMovieArchetypeRaceRail.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRaceRail.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeRaceRail.Dimension>(
      "raceRail",
      AutoMovieArchetypeRaceRail.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeRaceRail.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeRaceRail.BANDS,
  );
  const oval: AutoMovieArchetypeOval.IOval = AutoMovieArchetypeOval.lapped(
    AutoMovieArchetypeRaceRail.LAP,
    d.radius,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeRaceRail.Affordance,
    AutoMovieArchetypeRaceRail.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "aluminium",
    id: params.id,
    name: "racecourse inner rail",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const points: IAutoMovieVector3[] = AutoMovieArchetypeOval.rail(
    oval,
    d.spacing,
  );
  points.forEach((at: IAutoMovieVector3, k: number): void => {
    const next: IAutoMovieVector3 = points[(k + 1) % points.length]!;
    builder.rod(`post${k}`, d.post, v(at.x, 0, at.z), v(at.x, d.height, at.z), {
      color: "#f4f4f4",
    });
    builder.rod(
      `rail${k}`,
      d.post,
      v(at.x, d.height, at.z),
      v(next.x, d.height, next.z),
      { color: "#f4f4f4" },
    );
  });
  builder.affordance({
    id: "start",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(points[0]!.x, 0, points[0]!.z),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass * points.length);
}

  /**
   * The affordance id: `start`, the rail at the home straight's start, facing
   * up.
   */
  export type Affordance = "start";

  /**
   * The dimensions, metres unless stated:
   *
   * - `radius`: the rail's radius on each turn.
   * - `height`: the top rail above the ground; `post`: a post's and the rail's
   *   radius; `spacing`: from post to post along the rail.
   * - `mass`: one post and its rail, kilograms.
   */
  export type Dimension = "radius" | "height" | "post" | "spacing" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    radius: "m",
    height: "m",
    post: "m",
    spacing: "m",
    mass: "kg",
  };

  /**
   * A lap of the rail, metres: one mile, the main track of Churchill Downs
   * (https://en.wikipedia.org/wiki/Churchill_Downs).
   */
  export const LAP: number = 1609.344;

  /** The parameters: any free dimension fixed inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `raceRail` when absent. */
    id?: string;
  }

  /** The band of each free dimension, every one an estimate. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    radius: AutoMovieArchetypeBand.metres(140, 160, ESTIMATE, true),
    height: AutoMovieArchetypeBand.metres(1, 1.1, ESTIMATE, true),
    post: AutoMovieArchetypeBand.metres(0.04, 0.05, ESTIMATE, true),
    spacing: AutoMovieArchetypeBand.metres(8, 8, ESTIMATE, true),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      15,
      25,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
