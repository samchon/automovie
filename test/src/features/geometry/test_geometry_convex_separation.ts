import {
  boundAutoMovieConvexSeparation,
  boundAutoMovieProjectionSeparation,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Complete convex-feature projections cannot mistake positive corners for a
 * positive triangle interior, or an approximate distance for a separation proof.
 * Scenarios:
 * 1. Parallel overlapping faces have an independently known unit gap.
 * 2. Orthogonal micrometre segments have an interior one-micrometre gap.
 * 3. Coplanar overlap, vertex contact and a crossing face all bound to zero.
 * 4. Collapsed triangles and points retain their analytic separation.
 * 5. Translation, reversal, scale and Float32 representation preserve bounds.
 * 6. A sufficient threshold may stop early but cannot overestimate distance.
 */
export const test_geometry_convex_separation = (): void => {
  const p = (x: number, y: number, z: number) => ({ x, y, z });
  const a = [p(0, 0, 0), p(2, 0, 0), p(0, 2, 0)];
  const parallel = [p(0, 0, 1), p(2, 0, 1), p(0, 2, 1)];
  const check = (name: string, low: number, exact: number): void =>
    TestValidator.predicate(name, low <= exact && low > exact * (1 - 1e-12));
  check("parallel faces", boundAutoMovieConvexSeparation(a, parallel), 1);
  check(
    "early sufficient face bound",
    boundAutoMovieConvexSeparation(a, parallel, 0.5),
    1,
  );
  for (const scale of [1e-6, 1, 1e6]) {
    const first = [p(-5 * scale, 0, 0), p(5 * scale, 0, 0)];
    const second = [p(0, -5 * scale, scale), p(0, 5 * scale, scale)];
    check(
      "interior segment gap",
      boundAutoMovieConvexSeparation(first, second),
      scale,
    );
    check(
      "reversed segments",
      boundAutoMovieConvexSeparation(
        [...second].reverse(),
        [...first].reverse(),
      ),
      scale,
    );
  }
  for (const other of [
    a,
    [p(0, 0, 0)],
    [p(0.5, 0.5, -1), p(0.5, 0.5, 1), p(2, 2, 1)],
  ])
    TestValidator.equals(
      "inclusive contact/intersection unresolved",
      boundAutoMovieConvexSeparation(a, other),
      0,
    );
  check(
    "points",
    boundAutoMovieConvexSeparation([p(0, 0, 0)], [p(3, 4, 0)]),
    5,
  );
  check(
    "collapsed triangles",
    boundAutoMovieConvexSeparation(
      [p(0, 0, 0), p(0, 0, 0), p(0, 0, 0)],
      [p(1, 0, 0)],
    ),
    1,
  );
  check(
    "coplanar disjoint triangles",
    boundAutoMovieConvexSeparation(
      a,
      a.map((v) => p(v.x + 3, v.y, v.z)),
    ),
    1,
  );
  const cube = [-1, 1].flatMap((x) =>
    [-1, 1].flatMap((y) => [-1, 1].map((z) => p(x, y, z))),
  );
  TestValidator.equals(
    "interior point cannot separate from complete convex cell",
    boundAutoMovieConvexSeparation(cube, [p(0, 0, 0)]),
    0,
  );
  check(
    "convex cell face gap",
    boundAutoMovieConvexSeparation(cube, [p(0, 0, 3)]),
    2,
  );
  let work = 0;
  check(
    "counted interior closest directions",
    boundAutoMovieConvexSeparation(
      [p(-5e-6, 0, 0), p(5e-6, 0, 0)],
      [p(0, -5e-6, 1e-6), p(0, 5e-6, 1e-6)],
      0.5e-6,
      () => {
        work++;
      },
    ),
    1e-6,
  );
  TestValidator.predicate("axis and pair calculations spend work", work >= 3);
  const shift = (v: ReturnType<typeof p>) => p(v.x + 16, v.y - 8, v.z + 32);
  check(
    "translated faces",
    boundAutoMovieConvexSeparation(a.map(shift), parallel.map(shift)),
    1,
  );
  const f32 = parallel.map((v) =>
    p(Math.fround(v.x), Math.fround(v.y), Math.fround(v.z)),
  );
  check("represented Float32 faces", boundAutoMovieConvexSeparation(a, f32), 1);
  TestValidator.equals(
    "zero direction proves nothing",
    boundAutoMovieProjectionSeparation(a, parallel, p(0, 0, 0)),
    0,
  );
  TestValidator.equals(
    "wrong direction cannot create a gap",
    boundAutoMovieProjectionSeparation(a, parallel, p(1, 0, 0)),
    0,
  );
  TestValidator.predicate(
    "target zero remains a lower bound",
    boundAutoMovieConvexSeparation(a, parallel, 0) <= 1,
  );
};
