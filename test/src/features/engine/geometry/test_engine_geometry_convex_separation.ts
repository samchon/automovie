import {
  boundAutoMovieConvexSeparation,
  boundAutoMovieProjectionSeparation,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `boundAutoMovieConvexSeparation(a, b, target?)` returns a lower bound on the
 * distance between two convex point sets' hulls from complete feature
 * projections, never above the true gap; `boundAutoMovieProjectionSeparation`
 * reads one direction's projection gap.
 *
 * Fixture: the triangle A (0,0,0), (2,0,0), (0,2,0) and its copy at z = 1. A
 * bound is decided when it is the exact gap g within 1e-12 g and not above it.
 *
 * Scenarios:
 *
 * 1. A and its parallel copy: 1, and 1 with a sufficient target 0.5; translated
 *    by (16, -8, 32), and with the copy rounded to Float32: still 1.
 * 2. Orthogonal segments 10 s long crossing over a gap s (s = 1e-6, 1, 1e6): s,
 *    in either order; with target 0.5e-6 at s = 1e-6 the reported work counts
 *    at least three steps.
 * 3. A against itself, a shared vertex, and a triangle crossing it bound to 0.
 * 4. Points (0,0,0) and (3,4,0): 5; a collapsed triangle against (1,0,0): 1; A
 *    and its copy 3 along x: 1.
 * 5. The cube [-1, 1]^3 against its centre: 0; against (0, 0, 3): 2.
 * 6. A zero or wrong projection direction proves nothing (0); target 0 stays a
 *    lower bound.
 */
export function test_engine_geometry_convex_separation(): void {
  const p = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });
  const decided = (label: string, low: number, exact: number): void =>
    TestValidator.predicate(`${label}: ${low}`, low <= exact && low > exact * (1 - 1e-12));
  const a: IAutoMovieVector3[] = [p(0, 0, 0), p(2, 0, 0), p(0, 2, 0)];
  const lifted: IAutoMovieVector3[] = [p(0, 0, 1), p(2, 0, 1), p(0, 2, 1)];

  // 1.
  decided("parallel", boundAutoMovieConvexSeparation(a, lifted), 1);
  decided("sufficient target", boundAutoMovieConvexSeparation(a, lifted, 0.5), 1);
  const shift = (v: IAutoMovieVector3): IAutoMovieVector3 => p(v.x + 16, v.y - 8, v.z + 32);
  decided("translated", boundAutoMovieConvexSeparation(a.map(shift), lifted.map(shift)), 1);
  decided(
    "Float32",
    boundAutoMovieConvexSeparation(a, lifted.map((v) => p(Math.fround(v.x), Math.fround(v.y), Math.fround(v.z)))),
    1,
  );

  // 2.
  for (const s of [1e-6, 1, 1e6]) {
    const first: IAutoMovieVector3[] = [p(-5 * s, 0, 0), p(5 * s, 0, 0)];
    const second: IAutoMovieVector3[] = [p(0, -5 * s, s), p(0, 5 * s, s)];
    decided(`segments ${s}`, boundAutoMovieConvexSeparation(first, second), s);
    decided(`reversed ${s}`, boundAutoMovieConvexSeparation([...second].reverse(), [...first].reverse()), s);
  }
  let work: number = 0;
  decided(
    "counted",
    boundAutoMovieConvexSeparation([p(-5e-6, 0, 0), p(5e-6, 0, 0)], [p(0, -5e-6, 1e-6), p(0, 5e-6, 1e-6)], 0.5e-6, (): void => {
      work++;
    }),
    1e-6,
  );
  TestValidator.predicate("work spent", work >= 3);

  // 3.
  for (const other of [a, [p(0, 0, 0)], [p(0.5, 0.5, -1), p(0.5, 0.5, 1), p(2, 2, 1)]])
    TestValidator.equals("contact", boundAutoMovieConvexSeparation(a, other), 0);

  // 4.
  decided("points", boundAutoMovieConvexSeparation([p(0, 0, 0)], [p(3, 4, 0)]), 5);
  decided("collapsed", boundAutoMovieConvexSeparation([p(0, 0, 0), p(0, 0, 0), p(0, 0, 0)], [p(1, 0, 0)]), 1);
  decided("coplanar apart", boundAutoMovieConvexSeparation(a, a.map((v) => p(v.x + 3, v.y, v.z))), 1);

  // 5.
  const cube: IAutoMovieVector3[] = [-1, 1].flatMap((x: number) =>
    [-1, 1].flatMap((y: number) => [-1, 1].map((z: number) => p(x, y, z))),
  );
  TestValidator.equals("centre", boundAutoMovieConvexSeparation(cube, [p(0, 0, 0)]), 0);
  decided("face gap", boundAutoMovieConvexSeparation(cube, [p(0, 0, 3)]), 2);

  // 6.
  TestValidator.equals("zero direction", boundAutoMovieProjectionSeparation(a, lifted, p(0, 0, 0)), 0);
  TestValidator.equals("wrong direction", boundAutoMovieProjectionSeparation(a, lifted, p(1, 0, 0)), 0);
  TestValidator.predicate("target 0", boundAutoMovieConvexSeparation(a, lifted, 0) <= 1);
}
