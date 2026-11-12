import { AutoMovieMotionHumanClearance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The clearing path of a swinging foot: the taut string over a required
 * height, with its corners rounded and read by arc length.
 *
 * The taut string over a profile is known by hand for a box: from a start on
 * the floor at `z = 0` to a landing on the floor at `z = 1`, over a box 0.2 m
 * high between `z = 0.3` and `z = 0.5`, it is the three straight pieces
 * through `(0.3, 0.2)` and `(0.5, 0.2)`, `hypot(0.3, 0.2) + 0.2 +
 * hypot(0.5, 0.2)` long. A corner cut back by the radius `r` on both sides
 * and bridged by a quadratic Bezier arc lies under the corner by at most
 * `r / 2` (the arc's middle is half way from the chord's middle to the
 * corner), so the rounded path lies between the string and the string
 * lowered by `r / 2`, and is shorter than the string and longer than the
 * straight line between its ends. The profile is sampled every millimetre,
 * so an edge is placed within a millimetre.
 *
 * Scenarios:
 * 1. A step with no length is the straight line between its ends.
 * 2. A profile wholly under the straight line leaves the straight line.
 * 3. Over the box the path starts and ends on its ends, never goes back, lies
 *    within the band under the string, is shorter than the string and longer
 *    than the straight line, and moves the same distance for each equal share.
 * 4. A share outside [0, 1] is the nearer end.
 * 5. Between two boxes of one height the path does not dip: half way between
 *    them it is at the boxes' height.
 * 6. A landing on a raised tread (a stair) runs level over the tread once it
 *    is past the rounded nosing, and lands on its end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public builder and reads the path it returns; a path under the profile, a path that sags between two edges, a path read by `z` instead of by arc length, or an unclamped share fails.
 * @evidence contracts/development/testing.md#independent-expectations The string over a box is written out by hand with its length, and the band under it follows from the geometry of a quadratic Bezier arc and the stated radius.
 * @evidence contracts/development/testing.md#distinguishing-cases No span, nothing to clear, one obstacle, two obstacles and a raised landing; inside, at and outside the share's range.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit with no body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the string over the box with its length and the band, and lists the 6 scenarios.
 */
export function test_motion_compose_clearance(): void {
  type IPoint = AutoMovieMotionHumanClearance.IPoint;
  const close = (a: number, b: number, e: number = 1e-9): boolean =>
    Math.abs(a - b) <= e;
  const r: number = AutoMovieMotionHumanClearance.RADIUS;

  // 1. No span.
  const still: IPoint = AutoMovieMotionHumanClearance.path(
    { z: 0.4, y: 0 },
    { z: 0.4, y: 0.2 },
    (): number => 9,
  )(0.5);
  TestValidator.predicate(
    "a step with no length is a straight line",
    close(still.z, 0.4) && close(still.y, 0.1),
  );

  // 2. Nothing to clear.
  const open: (share: number) => IPoint = AutoMovieMotionHumanClearance.path(
    { z: 0, y: 0 },
    { z: 1, y: 0.5 },
    (): number => -1,
  );
  TestValidator.predicate(
    "a profile under the straight line leaves it straight",
    [0, 0.25, 0.5, 0.75, 1].every((share: number): boolean => {
      const p: IPoint = open(share);
      return close(p.z, share, 1e-9) && close(p.y, share / 2, 1e-9);
    }),
  );

  // 3. One box.
  const box: (share: number) => IPoint = AutoMovieMotionHumanClearance.path(
    { z: 0, y: 0 },
    { z: 1, y: 0 },
    (z: number): number => (z >= 0.3 && z <= 0.5 ? 0.2 : -1),
  );
  const string = (z: number): number =>
    z <= 0.3 ? (0.2 * z) / 0.3 : z <= 0.5 ? 0.2 : (0.2 * (1 - z)) / 0.5;
  const taut: number = Math.hypot(0.3, 0.2) + 0.2 + Math.hypot(0.5, 0.2);
  const count: number = 400;
  const points: IPoint[] = [];
  for (let i: number = 0; i <= count; i++) points.push(box(i / count));
  TestValidator.predicate(
    "the path over a box starts and ends on its ends",
    close(points[0]!.z, 0) &&
      close(points[0]!.y, 0) &&
      close(points[count]!.z, 1) &&
      close(points[count]!.y, 0),
  );
  TestValidator.predicate(
    "the path over a box never goes back",
    points.every(
      (p: IPoint, i: number): boolean => i === 0 || p.z >= points[i - 1]!.z,
    ),
  );
  const above: number = Math.max(
    ...points.map((p: IPoint): number => p.y - string(p.z)),
  );
  const below: number = Math.max(
    ...points.map((p: IPoint): number => string(p.z) - p.y),
  );
  TestValidator.predicate(
    `the path over a box lies within the band under the string: ${(above * 1000).toFixed(2)} mm above, ${(below * 1000).toFixed(2)} mm below`,
    above <= 0.001 && below <= r / 2 + 0.001,
  );
  const steps: number[] = points
    .slice(1)
    .map((p: IPoint, i: number): number =>
      Math.hypot(p.z - points[i]!.z, p.y - points[i]!.y),
    );
  const length: number = steps.reduce((a: number, b: number): number => a + b);
  TestValidator.predicate(
    `the path over a box is ${length.toFixed(4)} m, between 1 and the string's ${taut.toFixed(4)}`,
    length > 1 && length < taut && length > taut - 0.02,
  );
  TestValidator.predicate(
    "equal shares are equal distances",
    steps.every((d: number): boolean =>
      close(d, length / count, 0.01 * (length / count)),
    ),
  );

  // 4. Shares outside the range.
  TestValidator.predicate(
    "a share outside [0, 1] is the nearer end",
    close(box(-1).z, 0) &&
      close(box(-1).y, 0) &&
      close(box(2).z, 1) &&
      close(box(2).y, 0),
  );

  // 5. Two boxes.
  const pair: (share: number) => IPoint = AutoMovieMotionHumanClearance.path(
    { z: 0, y: 0 },
    { z: 1, y: 0 },
    (z: number): number =>
      (z >= 0.2 && z <= 0.3) || (z >= 0.7 && z <= 0.8) ? 0.2 : -1,
  );
  let middle: IPoint = pair(0);
  for (let i: number = 0; i <= 2000; i++) {
    const p: IPoint = pair(i / 2000);
    if (Math.abs(p.z - 0.5) < Math.abs(middle.z - 0.5)) middle = p;
  }
  TestValidator.predicate(
    `between two boxes the path stays at their height, ${middle.y.toFixed(4)} m at ${middle.z.toFixed(3)}`,
    close(middle.z, 0.5, 0.001) && close(middle.y, 0.2, 1e-6),
  );

  // 6. A raised landing.
  const stair: (share: number) => IPoint = AutoMovieMotionHumanClearance.path(
    { z: 0, y: 0 },
    { z: 0.5, y: 0.2 },
    (z: number): number => (z >= 0.25 ? 0.2 : -1),
  );
  const tread: IPoint[] = [];
  for (let i: number = 0; i <= 400; i++) {
    const p: IPoint = stair(i / 400);
    if (p.z >= 0.25 + r + 0.002) tread.push(p);
  }
  TestValidator.predicate(
    "past the nosing a path onto a tread runs level and lands on its end",
    tread.length > 10 &&
      tread.every((p: IPoint): boolean => close(p.y, 0.2, 1e-9)) &&
      close(stair(1).z, 0.5) &&
      close(stair(1).y, 0.2),
  );
}
