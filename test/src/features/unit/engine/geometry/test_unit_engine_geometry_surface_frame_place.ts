import {
  placeAutoMovieSurfaceFrame,
  prepareAutoMovieSurfaceFrame,
} from "@automovie/engine";
import type {
  IAutoMoviePreparedSurfaceFrame,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError, vclose } from "../../../internal/predicates";

/**
 * `prepareAutoMovieSurfaceFrame` reads a triangle's own frame about its
 * centroid and `placeAutoMovieSurfaceFrame` lays it into a target frame
 * (origin, forward, normal), keeping an explicit outward sign and tiny real
 * samples.
 *
 * Scenarios:
 *
 * 1. The triangle (-1,0,-1), (2,0,-1), (-1,0,2) (centroid the origin) with the
 *    reference normal (0, s, 0), s = +-1, has that normal, and placed on the
 *    level frame facing +x lands at its own points with z multiplied by s.
 * 2. The YZ triangle (0,0,0), (0,3,0), (0,0,3) placed on the level frame lands
 *    at (-1,0,1), (2,0,1), (-1,0,-2), its indices intact.
 * 3. The 1e-180 m triangle (0,0,0), (s,0,0), (0,s,0) (squared area underflows)
 *    placed on a frame of near-parallel directions of length 1e300 keeps its
 *    plane: in units of s it lands at (-1/3, -1/3), x 2/3 and y 2/3, z 0.
 * 4. The triangle of scenario 1 (reference +y) placed at origin (10, 20, 30)
 *    with the skew forward (0, 5, 9) and normal (0, 0, 3) lands at (9, 19,
 *    30), (9, 22, 30), (12, 19, 30): the forward projected into the normal
 *    plane, its edges 3, 3 and sqrt 18 unscaled, its centroid the origin.
 * 5. Placed at its own captured frame it is the source again.
 * 6. Editing the source and a returned point afterwards changes no later
 *    placement.
 * 7. Preparation refuses 0, 1, 2 and 4 points, a repeated point, three
 *    collinear points, an overflowing edge (+-MAX_VALUE) and a zero or
 *    in-plane reference normal; placement refuses a zero forward or normal, a
 *    forward along the normal and a destination that overflows; the prepared
 *    triangle still places at a valid frame afterwards.
 */
export function test_unit_engine_geometry_surface_frame_place(): void {
  const level = {
    origin: { x: 0, y: 0, z: 0 },
    forward: { x: 1, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
  };

  // 1.
  const source: IAutoMovieVector3[] = [
    { x: -1, y: 0, z: -1 },
    { x: 2, y: 0, z: -1 },
    { x: -1, y: 0, z: 2 },
  ];
  for (const sign of [-1, 1]) {
    const prepared: IAutoMoviePreparedSurfaceFrame = prepareAutoMovieSurfaceFrame(source, {
      x: 0,
      y: sign,
      z: 0,
    });
    TestValidator.predicate(`normal ${sign}`, vclose(prepared.frame.normal, { x: 0, y: sign, z: 0 }));
    const placed: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(prepared, level);
    source.forEach((p: IAutoMovieVector3, i: number): void =>
      TestValidator.predicate(`point ${sign}/${i}`, vclose(placed[i]!, { ...p, z: sign * p.z })),
    );
  }

  // 2.
  const flat: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(
    prepareAutoMovieSurfaceFrame([
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 0, y: 0, z: 3 },
    ]),
    level,
  );
  [
    { x: -1, y: 0, z: 1 },
    { x: 2, y: 0, z: 1 },
    { x: -1, y: 0, z: -2 },
  ].forEach((p: IAutoMovieVector3, i: number): void =>
    TestValidator.predicate(`YZ point ${i}`, vclose(flat[i]!, p)),
  );

  // 3.
  const s: number = 1e-180;
  const tiny: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(
    prepareAutoMovieSurfaceFrame([
      { x: 0, y: 0, z: 0 },
      { x: s, y: 0, z: 0 },
      { x: 0, y: s, z: 0 },
    ]),
    {
      origin: { x: 0, y: 0, z: 0 },
      forward: { x: 1e288, y: 0, z: 1e300 },
      normal: { x: 0, y: 0, z: 1e300 },
    },
  );
  TestValidator.predicate(
    "tiny triangle",
    nclose(tiny[0]!.x / s, -1 / 3) &&
      nclose(tiny[0]!.y / s, -1 / 3) &&
      nclose(tiny[1]!.x / s, 2 / 3) &&
      nclose(tiny[2]!.y / s, 2 / 3) &&
      nclose(tiny[2]!.z / s, 0),
  );

  // 4.
  const prepared: IAutoMoviePreparedSurfaceFrame = prepareAutoMovieSurfaceFrame(source, {
    x: 0,
    y: 1,
    z: 0,
  });
  const target = {
    origin: { x: 10, y: 20, z: 30 },
    forward: { x: 0, y: 5, z: 9 },
    normal: { x: 0, y: 0, z: 3 },
  };
  const expected: IAutoMovieVector3[] = [
    { x: 9, y: 19, z: 30 },
    { x: 9, y: 22, z: 30 },
    { x: 12, y: 19, z: 30 },
  ];
  const placed: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(prepared, target);
  expected.forEach((p: IAutoMovieVector3, i: number): void =>
    TestValidator.predicate(`placed ${i}`, vclose(placed[i]!, p)),
  );
  const length = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  TestValidator.predicate(
    "edges unscaled",
    nclose(length(placed[0]!, placed[1]!), 3) &&
      nclose(length(placed[0]!, placed[2]!), 3) &&
      nclose(length(placed[1]!, placed[2]!), Math.sqrt(18)),
  );
  TestValidator.predicate(
    "centroid",
    vclose(
      {
        x: (placed[0]!.x + placed[1]!.x + placed[2]!.x) / 3,
        y: (placed[0]!.y + placed[1]!.y + placed[2]!.y) / 3,
        z: (placed[0]!.z + placed[1]!.z + placed[2]!.z) / 3,
      },
      target.origin,
    ),
  );

  // 5.
  const restored: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(prepared, prepared.frame);
  source.forEach((p: IAutoMovieVector3, i: number): void =>
    TestValidator.predicate(`round trip ${i}`, vclose(restored[i]!, p)),
  );

  // 6.
  source[0]!.x = 999;
  placed[0]!.x = -999;
  const repeated: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(prepared, target);
  expected.forEach((p: IAutoMovieVector3, i: number): void =>
    TestValidator.predicate(`repeat ${i}`, vclose(repeated[i]!, p)),
  );

  // 7.
  const plane: IAutoMovieVector3[] = [
    { x: -1, y: -1, z: 0 },
    { x: 2, y: -1, z: 0 },
    { x: -1, y: 2, z: 0 },
  ];
  const M: number = Number.MAX_VALUE;
  for (const points of [
    ...[0, 1, 2, 4].map((n: number): IAutoMovieVector3[] =>
      Array.from({ length: n }, (_: unknown, i: number): IAutoMovieVector3 => plane[i % 3]!),
    ),
    [plane[0]!, plane[0]!, plane[2]!],
    [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1 },
      { x: 2, y: 2, z: 2 },
    ],
    [
      { x: -M, y: 0, z: 0 },
      { x: M, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ],
  ])
    TestValidator.predicate(
      `prepare refuses ${points.length} points`,
      throwsError((): unknown => prepareAutoMovieSurfaceFrame(points)),
    );
  for (const reference of [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ])
    TestValidator.predicate(
      "reference refused",
      throwsError((): unknown => prepareAutoMovieSurfaceFrame(plane, reference)),
    );
  const ready: IAutoMoviePreparedSurfaceFrame = prepareAutoMovieSurfaceFrame(plane);
  const up = { origin: { x: 0, y: 0, z: 0 }, forward: { x: 1, y: 0, z: 0 }, normal: { x: 0, y: 0, z: 1 } };
  for (const frame of [
    { ...up, forward: { x: 0, y: 0, z: 0 } },
    { ...up, normal: { x: 0, y: 0, z: 0 } },
    { ...up, forward: { x: 0, y: 0, z: -2 } },
  ])
    TestValidator.predicate(
      "frame refused",
      throwsError((): unknown => placeAutoMovieSurfaceFrame(ready, frame)),
    );
  const huge: IAutoMoviePreparedSurfaceFrame = prepareAutoMovieSurfaceFrame([
    { x: -M / 2, y: 0, z: 0 },
    { x: M / 2, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  ]);
  TestValidator.predicate(
    "overflowing destination refused",
    throwsError((): unknown => placeAutoMovieSurfaceFrame(huge, { ...up, origin: { x: M, y: 0, z: 0 } })),
  );
  const recovered: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(ready, up);
  plane.forEach((p: IAutoMovieVector3, i: number): void =>
    TestValidator.predicate(`recovered ${i}`, vclose(recovered[i]!, p)),
  );
}
