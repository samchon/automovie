import { resolveAutoMovieMutualGoal } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Two people's hands meet at one shared point both can reach: midway between
 * their shoulders, at a height both comfortable reaches agree on, or refused
 * with the gap the pair can close.
 *
 * Scenarios:
 * 1. Horizontal location: the point lies on the horizontal midpoint of the
 *    two shoulders (Hansen et al. 2017), whatever their heights.
 * 2. Swapping the partners leaves the point unchanged and swaps the
 *    distances.
 * 3. Scaling both people and their gap by k about the floor origin scales the
 *    point by k (dynamic similarity of the geometry).
 * 4. A taller partner (higher shoulder) raises the point; equal people meet
 *    below their shoulders by the comfortable-reach drop
 *    `sqrt(reach^2 - h^2)`.
 *    A child and a tall adult whose comfortable mean lies below the adult's
 *    straight arm meet at the adult's lowest reachable height, both within
 *    their limits.
 * 5. Shoulders farther apart than the full reaches allow are refused, and the
 *    message names the largest closable gap, which itself is accepted.
 * 6. A comfortable reach above the limit, or a non-positive reach, throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver; a point off the midpoint, an order-dependent result, a non-scaling height, a height ignoring stature or a stretched arm instead of a refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations The midpoint rule is Hansen et al. 2017's finding; the equal-people drop follows from the right triangle of the arm; symmetry and scaling are metamorphic relations; the refusal's gap is re-checked by calling the resolver at it.
 * @evidence contracts/development/testing.md#distinguishing-cases Equal and unequal statures, near and far gaps, the boundary gap, and invalid reaches.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory engine unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 scenarios and what each pins.
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
  const a: resolveAutoMovieMutualGoal.ISide = side(0.1, 0, 1.45, 0.5, 0.68);
  const b: resolveAutoMovieMutualGoal.ISide = side(0.3, 0.8, 1.32, 0.45, 0.62);

  // 1. Horizontal midpoint.
  const goal: resolveAutoMovieMutualGoal.IGoal = resolveAutoMovieMutualGoal({
    a,
    b,
  });
  TestValidator.predicate(
    "horizontal midpoint",
    close(goal.point.x, 0.2) && close(goal.point.z, 0.4),
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

  // 4. Stature raises the point; equal people drop by the arm's triangle.
  const even: resolveAutoMovieMutualGoal.IGoal = resolveAutoMovieMutualGoal({
    a: side(0, 0, 1.4, 0.5, 0.65),
    b: side(0, 0.6, 1.4, 0.5, 0.65),
  });
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

  // 4b. A child and a tall adult: the comfortable mean lies beyond the
  // adult's straight arm, so the point rises to the lowest height the adult
  // reaches, and both distances stay within their limits.
  const child: resolveAutoMovieMutualGoal.ISide = side(0, 0, 1.0, 0.35, 0.45);
  const adult: resolveAutoMovieMutualGoal.ISide = side(0, 0.6, 1.7, 0.5, 0.65);
  const mixed: resolveAutoMovieMutualGoal.IGoal = resolveAutoMovieMutualGoal({
    a: child,
    b: adult,
  });
  TestValidator.predicate(
    "a child and an adult meet within both reaches",
    mixed.distance[0] <= 0.45 + 1e-9 && mixed.distance[1] <= 0.65 + 1e-9,
  );
  TestValidator.predicate(
    "the meeting rises to the adult's lowest reach",
    close(mixed.point.y, 1.7 - Math.sqrt(0.65 * 0.65 - 0.09)),
  );

  // 5. Refusal with the closable gap.
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

  // 6. Invalid reaches.
  TestValidator.error("reach above limit", (): unknown =>
    resolveAutoMovieMutualGoal({ a: side(0, 0, 1.4, 0.7, 0.65), b }),
  );
  TestValidator.error("zero reach", (): unknown =>
    resolveAutoMovieMutualGoal({ a: side(0, 0, 1.4, 0, 0.65), b }),
  );
}
