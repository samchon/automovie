import { resolveAutoMovieMutualGoal } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Two people's hands meet at the one point where both arms are at their
 * comfortable reach, below the line between their shoulders, or refused with
 * the gap the pair can close.
 *
 * Scenarios:
 * 1. Shoulders within both comfortable reaches: the point lies exactly one
 *    comfortable reach from each shoulder, in the vertical plane through the
 *    two shoulders and below the line between them.
 * 2. Swapping the partners leaves the point unchanged and swaps the
 *    distances.
 * 3. Scaling both people and their gap by k about the floor origin scales the
 *    point by k (dynamic similarity of the geometry).
 * 4. Equal people meet at the midpoint (Hansen et al. 2017), below their
 *    shoulders by `sqrt(reach^2 - h^2)`; a taller partner raises the point
 *    and draws it toward itself.
 * 5. Shoulders farther apart than both comfortable reaches, but within the
 *    limits: the point lies on the line between the shoulders, the two
 *    distances summing to the shoulders' distance in the ratio of the
 *    comfortable reaches. A child and a tall adult meet the same way, both
 *    within their limits.
 * 6. Shoulders farther apart than the full reaches allow are refused, and the
 *    message names the largest closable gap, which itself is accepted.
 * 7. A comfortable reach above the limit, or a non-positive reach, throws.
 * 8. A preferred height: equal people meet at it at the midpoint; unequal
 *    reaches meet at it with both arms the same fraction of their comfortable
 *    reaches; a height below both straight arms rises to the lowest height
 *    both reach.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver; a point off either comfortable reach, above the shoulder line, order-dependent, non-scaling, ignoring stature, or a stretched arm instead of a refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the stated distances themselves, measured here from the returned point; the midpoint of equal arms is Hansen et al. 2017's finding and their drop follows from the right triangle of the arm; symmetry and scaling are metamorphic relations; the refusal's gap is re-checked by calling the resolver at it.
 * @evidence contracts/development/testing.md#distinguishing-cases Equal and unequal statures and reaches, near and far gaps, the boundary gap, a preferred height inside and outside the reachable band, and invalid reaches.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory engine unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 8 scenarios and what each pins.
 */
export function test_motion_handling_mutual_goal(): void {
  const close = (a: number, b: number, e: number = 1e-9): boolean =>
    Math.abs(a - b) <= e;
  const side = (
    x: number,
    z: number,
    height: number,
    reach: number,
    limit: number,
  ): resolveAutoMovieMutualGoal.ISide => ({
    shoulder: { x, y: height, z },
    reach,
    limit,
  });
  const far = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  const a: resolveAutoMovieMutualGoal.ISide = side(0.1, 0, 1.45, 0.5, 0.68);
  const b: resolveAutoMovieMutualGoal.ISide = side(0.3, 0.8, 1.32, 0.45, 0.62);

  // 1. Both arms at their comfortable reach, in the shoulders' vertical
  // plane, below the line between the shoulders.
  const goal: resolveAutoMovieMutualGoal.IGoal = resolveAutoMovieMutualGoal({
    a,
    b,
  });
  TestValidator.predicate(
    "both arms at their comfortable reach",
    close(far(goal.point, a.shoulder), 0.5) &&
      close(far(goal.point, b.shoulder), 0.45) &&
      close(goal.distance[0], 0.5) &&
      close(goal.distance[1], 0.45),
  );
  TestValidator.predicate(
    "in the vertical plane through the shoulders",
    close((goal.point.x - 0.1) * 0.8 - goal.point.z * 0.2, 0),
  );
  TestValidator.predicate(
    "below the line between the shoulders",
    goal.point.y < 1.45 - 0.13 * (goal.point.z / 0.8),
  );

  // 2. Partner symmetry.
  const swapped: resolveAutoMovieMutualGoal.IGoal = resolveAutoMovieMutualGoal({
    a: b,
    b: a,
  });
  TestValidator.predicate(
    "swap keeps the point",
    close(swapped.point.x, goal.point.x) &&
      close(swapped.point.y, goal.point.y) &&
      close(swapped.point.z, goal.point.z),
  );
  TestValidator.predicate(
    "swap swaps distances",
    close(swapped.distance[0], goal.distance[1]) &&
      close(swapped.distance[1], goal.distance[0]),
  );

  // 3. Scaling.
  const k: number = 0.8;
  const scale = (
    s: resolveAutoMovieMutualGoal.ISide,
  ): resolveAutoMovieMutualGoal.ISide => ({
    shoulder: { x: k * s.shoulder.x, y: k * s.shoulder.y, z: k * s.shoulder.z },
    reach: k * s.reach,
    limit: k * s.limit,
  });
  const small: IAutoMovieVector3 = resolveAutoMovieMutualGoal({
    a: scale(a),
    b: scale(b),
  }).point;
  TestValidator.predicate(
    "scales with the people",
    close(small.x, k * goal.point.x) &&
      close(small.y, k * goal.point.y) &&
      close(small.z, k * goal.point.z),
  );

  // 4. Equal people drop by the arm's triangle; stature raises the point and
  // draws it toward the taller partner.
  const even: resolveAutoMovieMutualGoal.IGoal = resolveAutoMovieMutualGoal({
    a: side(0, 0, 1.4, 0.5, 0.65),
    b: side(0, 0.6, 1.4, 0.5, 0.65),
  });
  TestValidator.predicate(
    "equal people meet at the midpoint",
    close(even.point.x, 0) && close(even.point.z, 0.3),
  );
  TestValidator.predicate(
    "equal people drop by sqrt(reach^2 - h^2)",
    close(even.point.y, 1.4 - Math.sqrt(0.25 - 0.09)),
  );
  const taller: resolveAutoMovieMutualGoal.IGoal = resolveAutoMovieMutualGoal({
    a: side(0, 0, 1.4, 0.5, 0.65),
    b: side(0, 0.6, 1.6, 0.5, 0.65),
  });
  TestValidator.predicate(
    "a taller partner raises the point",
    taller.point.y > even.point.y + 0.05,
  );
  TestValidator.predicate(
    "a taller partner draws the point toward itself",
    taller.point.z > even.point.z + 0.05,
  );

  // 5. Farther apart than both comfortable reaches: on the line between the
  // shoulders, each arm extended by the same factor.
  for (const [label, near, away] of [
    ["adults", side(0, 0, 1.4, 0.5, 0.65), side(0, 1.1, 1.5, 0.4, 0.6)],
    [
      "a child and an adult",
      side(0, 0, 1.0, 0.35, 0.45),
      side(0, 0.6, 1.7, 0.5, 0.65),
    ],
  ] as const) {
    const wide: resolveAutoMovieMutualGoal.IGoal = resolveAutoMovieMutualGoal({
      a: near,
      b: away,
    });
    TestValidator.predicate(
      `${label} apart meet on the line between the shoulders`,
      close(
        wide.distance[0] + wide.distance[1],
        far(near.shoulder, away.shoulder),
      ),
    );
    TestValidator.predicate(
      `${label} apart extend by one factor, within both limits`,
      close(wide.distance[0] * away.reach, wide.distance[1] * near.reach) &&
        wide.distance[0] > near.reach &&
        wide.distance[0] <= near.limit &&
        wide.distance[1] <= away.limit,
    );
  }

  // 6. Refusal with the closable gap.
  let message: string = "";
  try {
    resolveAutoMovieMutualGoal({
      a: side(0, 0, 1.4, 0.5, 0.65),
      b: side(0, 2, 1.4, 0.5, 0.65),
    });
  } catch (error) {
    message = (error as Error).message;
  }
  const gap: number = Number(/within about ([0-9.]+) m/.exec(message)?.[1]);
  TestValidator.predicate(
    `refused with a gap (${message})`,
    gap > 1.2 && gap <= 1.3,
  );
  TestValidator.predicate(
    "the reported gap is accepted",
    resolveAutoMovieMutualGoal({
      a: side(0, 0, 1.4, 0.5, 0.65),
      b: side(0, gap - 1e-3, 1.4, 0.5, 0.65),
    }).distance[0] <= 0.65,
  );

  // 7. Invalid reaches.
  TestValidator.error("reach above limit", (): unknown =>
    resolveAutoMovieMutualGoal({ a: side(0, 0, 1.4, 0.7, 0.65), b }),
  );
  TestValidator.error("zero reach", (): unknown =>
    resolveAutoMovieMutualGoal({ a: side(0, 0, 1.4, 0, 0.65), b }),
  );

  // 8. A preferred height.
  const level: IAutoMovieVector3 = resolveAutoMovieMutualGoal({
    a: side(0, 0, 1.4, 0.5, 0.65),
    b: side(0, 0.6, 1.4, 0.5, 0.65),
    height: 1.2,
  }).point;
  TestValidator.predicate(
    "equal people meet at the preferred height at the midpoint",
    close(level.x, 0) && close(level.y, 1.2) && close(level.z, 0.3),
  );
  const uneven: resolveAutoMovieMutualGoal.IGoal = resolveAutoMovieMutualGoal({
    a,
    b,
    height: 1.2,
  });
  TestValidator.predicate(
    "unequal reaches meet at the preferred height at one fraction of each",
    close(uneven.point.y, 1.2) &&
      close(uneven.distance[0] * 0.45, uneven.distance[1] * 0.5, 1e-9),
  );
  TestValidator.predicate(
    "a height below both straight arms rises to the lowest both reach",
    close(
      resolveAutoMovieMutualGoal({
        a: side(0, 0, 1.4, 0.5, 0.65),
        b: side(0, 0.6, 1.4, 0.5, 0.65),
        height: 0.2,
      }).point.y,
      1.4 - Math.sqrt(0.65 * 0.65 - 0.09),
    ),
  );
}
