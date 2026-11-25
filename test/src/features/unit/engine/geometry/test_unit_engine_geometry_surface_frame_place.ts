import {
  placeAutoMovieSurfaceFrame,
  prepareAutoMovieSurfaceFrame,
} from "@automovie/engine";
import type {
  IAutoMoviePreparedSurfaceFrame,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../../../internal/predicates";

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
}
