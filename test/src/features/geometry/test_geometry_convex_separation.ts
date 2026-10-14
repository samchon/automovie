import { type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { boundAutoMovieConvexSeparation, boundAutoMovieProjectionSeparation } from "@automovie/engine";

import { nclose } from "../internal/nclose";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls convex and fixed-direction projection bounds, checking positive conservative bounds close to analytic distances, zero for contact/intersection or ineffective directions, and work spent on closest-feature calculations. It catches corner-only separation that misses an interior contact.
 * @evidence contracts/testing.md#independent-expectations Parallel planes and orthogonal segments have the authored gap, points separated by (3,4,0) have distance five, and the cube's nearest face is two units from z=3. Bounds must stay below these distances and within the retained strict relative 1e-12 window; zero means no separation proof, not a penetration diagnosis.
 * @evidence contracts/testing.md#distinguishing-cases Preserves overlapping/contact/crossing cells, collapsed triangles and points, coplanar disjoint faces, reversal, three scales, translation, Float32 inputs, sufficient early stopping, zero target and ineffective directions. Admission/refusal behavior of resident mesh queries belongs to mesh-separation.
 * @evidence contracts/testing.md#execution-ownership The named entry directly executes portable projection source on the existing authored vectors, with an ordinary work-count callback. It starts no process, browser, GPU or native build and dynamically registers no cases; the numeric bounds do not certify rendered geometry.
 */
export function test_geometry_convex_separation(): void {
  const p: (x: number, y: number, z: number) => IAutoMovieVector3 = (
    x: number,
    y: number,
    z: number,
  ): IAutoMovieVector3 => ({ x, y, z });
  const a: IAutoMovieVector3[] = [p(0, 0, 0), p(2, 0, 0), p(0, 2, 0)];
  const parallel: IAutoMovieVector3[] = [p(0, 0, 1), p(2, 0, 1), p(0, 2, 1)];
  const check: (name: string, low: number, exact: number) => void = (
    name: string,
    low: number,
    exact: number,
  ): void =>
    TestValidator.predicate(
      name,
      nclose(low, exact, exact * 1e-12) &&
        low <= exact &&
        low > exact * (1 - 1e-12),
    );
  check("parallel faces", boundAutoMovieConvexSeparation(a, parallel), 1);
  check(
    "early sufficient face bound",
    boundAutoMovieConvexSeparation(a, parallel, 0.5),
    1,
  );
  for (const scale of [1e-6, 1, 1e6]) {
    const first: IAutoMovieVector3[] = [
      p(-5 * scale, 0, 0),
      p(5 * scale, 0, 0),
    ];
    const second: IAutoMovieVector3[] = [
      p(0, -5 * scale, scale),
      p(0, 5 * scale, scale),
    ];
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
    TestValidator.predicate(
      "inclusive contact/intersection unresolved",
      nclose(boundAutoMovieConvexSeparation(a, other), 0, 0),
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
      a.map((v: IAutoMovieVector3): IAutoMovieVector3 => p(v.x + 3, v.y, v.z)),
    ),
    1,
  );
  const cube: IAutoMovieVector3[] = [-1, 1].flatMap(
    (x: number): IAutoMovieVector3[] =>
      [-1, 1].flatMap((y: number): IAutoMovieVector3[] =>
        [-1, 1].map((z: number): IAutoMovieVector3 => p(x, y, z)),
      ),
  );
  TestValidator.predicate(
    "interior point cannot separate from complete convex cell",
    nclose(boundAutoMovieConvexSeparation(cube, [p(0, 0, 0)]), 0, 0),
  );
  check(
    "convex cell face gap",
    boundAutoMovieConvexSeparation(cube, [p(0, 0, 3)]),
    2,
  );
  let work: number = 0;
  check(
    "counted interior closest directions",
    boundAutoMovieConvexSeparation(
      [p(-5e-6, 0, 0), p(5e-6, 0, 0)],
      [p(0, -5e-6, 1e-6), p(0, 5e-6, 1e-6)],
      0.5e-6,
      (): void => {
        work++;
      },
    ),
    1e-6,
  );
  TestValidator.predicate("axis and pair calculations spend work", work >= 3);
  const shift: (
    v: ReturnType<(x: number, y: number, z: number) => IAutoMovieVector3>,
  ) => IAutoMovieVector3 = (v: ReturnType<typeof p>): IAutoMovieVector3 =>
    p(v.x + 16, v.y - 8, v.z + 32);
  check(
    "translated faces",
    boundAutoMovieConvexSeparation(a.map(shift), parallel.map(shift)),
    1,
  );
  const f32: IAutoMovieVector3[] = parallel.map(
    (v: IAutoMovieVector3): IAutoMovieVector3 =>
      p(Math.fround(v.x), Math.fround(v.y), Math.fround(v.z)),
  );
  check("represented Float32 faces", boundAutoMovieConvexSeparation(a, f32), 1);
  TestValidator.predicate(
    "zero direction proves nothing",
    nclose(boundAutoMovieProjectionSeparation(a, parallel, p(0, 0, 0)), 0, 0),
  );
  TestValidator.predicate(
    "wrong direction cannot create a gap",
    nclose(boundAutoMovieProjectionSeparation(a, parallel, p(1, 0, 0)), 0, 0),
  );
  TestValidator.predicate(
    "target zero remains a lower bound",
    boundAutoMovieConvexSeparation(a, parallel, 0) <= 1,
  );
}
