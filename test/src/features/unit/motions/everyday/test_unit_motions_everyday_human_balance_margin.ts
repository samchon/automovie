import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanBalance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/** Rounding of a few floor-plane cross products and distances, metres. */
const ROUNDING: number = 1e-9;

/** The floor-plane cross product of `b − a` and `c − a`. */
function cross(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
): number {
  return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
}

/** The floor-plane distance from a point to a segment. */
function distance(
  p: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  const ex: number = b.x - a.x;
  const ez: number = b.z - a.z;
  const length: number = ex * ex + ez * ez;
  const t: number =
    length === 0
      ? 0
      : Math.min(
          1,
          Math.max(0, ((p.x - a.x) * ex + (p.z - a.z) * ez) / length),
        );
  return Math.hypot(p.x - a.x - t * ex, p.z - a.z - t * ez);
}

/**
 * The support polygon's edges by brute force: each pair of distinct points with
 * every other point on its left, the polygon running counter-clockwise in the
 * (x, z) plane.
 */
function edges(
  points: readonly IAutoMovieVector3[],
): [IAutoMovieVector3, IAutoMovieVector3][] {
  const out: [IAutoMovieVector3, IAutoMovieVector3][] = [];
  for (const a of points)
    for (const b of points)
      if (
        Math.hypot(b.x - a.x, b.z - a.z) > ROUNDING &&
        points.every(
          (c: IAutoMovieVector3): boolean => cross(a, b, c) >= -ROUNDING,
        )
      )
        out.push([a, b]);
  return out;
}

/**
 * `HumanBalance.margin` is the static margin of stability (Hof et al. 2005,
 * zero velocity): the floor-plane distance from the whole-body centre of mass
 * to the edge of the convex hull of the base of support, positive inside and
 * negative outside; and `HumanBalance.along`, the margin along a direction from
 * a point inside, is never less than the point's distance to the nearest edge,
 * equal to it along that edge's outward normal.
 *
 * The body is built whole (`humanFixtureBody`): the centre weighs every
 * segment's mass placed by forward kinematics, and the base is both feet's
 * bearing outlines.
 *
 * Scenarios, the average man upright, his support (`HumanBalance.support`) read
 * once:
 *
 * 1. The support polygon, found by brute force over the support points, has at
 *    least three edges and holds the points' mean.
 * 2. The margin is the centre's distance to the nearest edge, negated when the
 *    centre lies outside the polygon.
 * 3. From the points' mean, along each edge's outward normal the directional
 *    margin is at least the distance to the nearest edge, and its least is that
 *    distance.
 */
export async function test_unit_motions_everyday_human_balance_margin(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const upright: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const support: ReturnType<typeof HumanBalance.support> = HumanBalance.support(
    body,
    upright,
  );
  const centre: IAutoMovieVector3 = support.centre;
  const polygon: [IAutoMovieVector3, IAutoMovieVector3][] = edges(
    support.points,
  );

  // 1. A polygon.
  const inside = (p: IAutoMovieVector3): boolean =>
    polygon.every(
      ([a, b]: [IAutoMovieVector3, IAutoMovieVector3]): boolean =>
        cross(a, b, p) > 0,
    );
  const nearest = (p: IAutoMovieVector3): number =>
    Math.min(
      ...polygon.map(([a, b]: [IAutoMovieVector3, IAutoMovieVector3]): number =>
        distance(p, a, b),
      ),
    );
  const middle: IAutoMovieVector3 = {
    x:
      support.points.reduce(
        (s: number, p: IAutoMovieVector3): number => s + p.x,
        0,
      ) / support.points.length,
    y: 0,
    z:
      support.points.reduce(
        (s: number, p: IAutoMovieVector3): number => s + p.z,
        0,
      ) / support.points.length,
  };
  TestValidator.predicate(
    "a polygon about the points' mean",
    polygon.length >= 3 && inside(middle),
  );

  // 2. The margin, signed.
  TestValidator.predicate(
    "the margin is the signed distance to the nearest edge",
    nclose(
      HumanBalance.margin(body, upright),
      inside(centre) ? nearest(centre) : -nearest(centre),
      ROUNDING,
    ),
  );

  // 3. Along the edges' normals, from inside.
  const along: number[] = polygon.map(
    ([a, b]: [IAutoMovieVector3, IAutoMovieVector3]): number =>
      HumanBalance.along(middle, support.points, {
        x: b.z - a.z,
        y: 0,
        z: -(b.x - a.x),
      }),
  );
  TestValidator.predicate(
    "the directional margin bounds the nearest edge's distance and meets it",
    along.every((v: number): boolean => v >= nearest(middle) - ROUNDING) &&
      nclose(Math.min(...along), nearest(middle), ROUNDING),
  );
}
