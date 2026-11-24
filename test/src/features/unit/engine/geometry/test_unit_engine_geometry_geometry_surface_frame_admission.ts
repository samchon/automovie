import {
  placeAutoMovieSurfaceFrame,
  prepareAutoMovieSurfaceFrame,
} from "@automovie/engine";
import type {
  IAutoMoviePreparedSurfaceFrame,
  IAutoMovieSurfaceFrame,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError, vclose } from "../../../internal/predicates";

/**
 * Invalid surface geometry and destination frames refuse before returning points.
 *
 * Scenarios:
 * 1. Empty, singleton, two-point and four-point samples refuse exact-three admission.
 * 2. Coincident, collinear and nonfinite triangles refuse, as do overflowing edges.
 * 3. Zero, perpendicular and nonfinite reference normals cannot choose a sign.
 * 4. Nonfinite origins and zero, parallel or nonfinite destination directions refuse.
 * 5. Finite inputs producing unrepresentable destination points refuse.
 * 6. A failed placement leaves the prepared data usable at a valid destination.
 */
export function test_unit_engine_geometry_geometry_surface_frame_admission(): void {
  const source: IAutoMovieVector3[] = [
    { x: -1, y: -1, z: 0 },
    { x: 2, y: -1, z: 0 },
    { x: -1, y: 2, z: 0 },
  ];
  for (const count of [0, 1, 2, 4]) {
    const points: IAutoMovieVector3[] = Array.from(
      { length: count },
      (_value: unknown, index: number): IAutoMovieVector3 => source[index % 3],
    );
    TestValidator.predicate(
      `point count ${count} refuses`,
      throwsError(
        (): IAutoMoviePreparedSurfaceFrame =>
          prepareAutoMovieSurfaceFrame(points),
      ),
    );
  }

  const invalid: IAutoMovieVector3[][] = [
    [source[0], source[0], source[2]],
    [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1 },
      { x: 2, y: 2, z: 2 },
    ],
    [
      { x: -Number.MAX_VALUE, y: 0, z: 0 },
      { x: Number.MAX_VALUE, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ],
  ];
  for (const points of invalid)
    TestValidator.predicate(
      "invalid source geometry refuses",
      throwsError(
        (): IAutoMoviePreparedSurfaceFrame =>
          prepareAutoMovieSurfaceFrame(points),
      ),
    );

  for (const normal of [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ])
    TestValidator.predicate(
      "invalid sign reference refuses",
      throwsError(
        (): IAutoMoviePreparedSurfaceFrame =>
          prepareAutoMovieSurfaceFrame(source, normal),
      ),
    );

  const prepared: IAutoMoviePreparedSurfaceFrame =
    prepareAutoMovieSurfaceFrame(source);
  const target: IAutoMovieSurfaceFrame = {
    origin: { x: 0, y: 0, z: 0 },
    forward: { x: 1, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
  };
  const invalidFrames: IAutoMovieSurfaceFrame[] = [
    { ...target, forward: { x: 0, y: 0, z: 0 } },
    { ...target, normal: { x: 0, y: 0, z: 0 } },
    { ...target, forward: { x: 0, y: 0, z: -2 } },
  ];
  for (const frame of invalidFrames)
    TestValidator.predicate(
      "invalid destination frame refuses",
      throwsError((): IAutoMovieVector3[] =>
        placeAutoMovieSurfaceFrame(prepared, frame),
      ),
    );

  const huge: IAutoMoviePreparedSurfaceFrame = prepareAutoMovieSurfaceFrame([
    { x: -Number.MAX_VALUE / 2, y: 0, z: 0 },
    { x: Number.MAX_VALUE / 2, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  ]);
  TestValidator.predicate(
    "finite target and offsets cannot return infinity",
    throwsError((): IAutoMovieVector3[] =>
      placeAutoMovieSurfaceFrame(huge, {
        ...target,
        origin: { x: Number.MAX_VALUE, y: 0, z: 0 },
      }),
    ),
  );
  const recovered: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(
    prepared,
    target,
  );
  for (let i: number = 0; i < 3; i++)
    TestValidator.predicate(
      `valid after refusals ${i}`,
      vclose(recovered[i], source[i]),
    );
}
