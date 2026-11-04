import {
  type IAutoMoviePreparedSurfaceFrame,
  placeAutoMovieSurfaceFrame,
  prepareAutoMovieSurfaceFrame,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * Surface orientation preserves an explicit outward sign and real small samples.
 *
 * Scenarios:
 * 1. Opposite normal references select opposite sides about the same heading.
 * 2. A triangle in the YZ plane maps to XZ with its three point indices intact.
 * 3. A 1e-180 metre triangle remains noncollinear despite squared-area underflow.
 * 4. Near-parallel, extreme-length destination directions retain their plane.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises normal-sign selection, a second source plane and axis, a tiny triangle and nearly parallel target directions, asserting literal point placements and source normal. Wrong cross order, ignoring the reference or a fixed degeneracy threshold fails these cases.
 * @evidence contracts/testing.md#independent-expectations Axis-aligned source coordinates determine their normal and centroid analytically; reversing the chosen normal reflects the triangle about its forward axis. Small-scale expectations divide output by the authored scale before comparing literal coordinates, independent of implementation thresholds or output snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Separates positive and negative reference signs, non-X source heading, tiny nonzero geometry and a finite nearly parallel target from the exact zero/parallel refusals in the admission test.
 * @evidence contracts/testing.md#execution-ownership This portable named geometry unit owns its loops and numerical assertions without spawning a process, renderer, browser, compiler or runtime host.
 */
export function test_geometry_surface_frame_orientation(): void {
  const source: IAutoMovieVector3[] = [
    { x: -1, y: 0, z: -1 },
    { x: 2, y: 0, z: -1 },
    { x: -1, y: 0, z: 2 },
  ];
  for (const sign of [-1, 1]) {
    const prepared: IAutoMoviePreparedSurfaceFrame = prepareAutoMovieSurfaceFrame(
      source,
      { x: 0, y: sign, z: 0 },
    );
    const placed: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(prepared, {
      origin: { x: 0, y: 0, z: 0 },
      forward: { x: 1, y: 0, z: 0 },
      normal: { x: 0, y: 1, z: 0 },
    });
    TestValidator.predicate(
      `explicit normal sign ${sign}`,
      vclose(prepared.frame.normal, { x: 0, y: sign, z: 0 }),
    );
    for (let i: number = 0; i < 3; i++)
      TestValidator.predicate(
        `oriented point ${sign}/${i}`,
        vclose(placed[i], { ...source[i], z: sign * source[i].z }),
      );
  }

  const upright: IAutoMoviePreparedSurfaceFrame = prepareAutoMovieSurfaceFrame([
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 3, z: 0 },
    { x: 0, y: 0, z: 3 },
  ]);
  const flattened: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(upright, {
    origin: { x: 0, y: 0, z: 0 },
    forward: { x: 1, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
  });
  const flatExpected: IAutoMovieVector3[] = [
    { x: -1, y: 0, z: 1 },
    { x: 2, y: 0, z: 1 },
    { x: -1, y: 0, z: -2 },
  ];
  for (let i: number = 0; i < 3; i++)
    TestValidator.predicate(`YZ source point ${i}`, vclose(flattened[i], flatExpected[i]));

  const scale: number = 1e-180;
  const tiny: IAutoMoviePreparedSurfaceFrame = prepareAutoMovieSurfaceFrame([
    { x: 0, y: 0, z: 0 },
    { x: scale, y: 0, z: 0 },
    { x: 0, y: scale, z: 0 },
  ]);
  const tinyPlaced: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(tiny, {
    origin: { x: 0, y: 0, z: 0 },
    forward: { x: 1e288, y: 0, z: 1e300 },
    normal: { x: 0, y: 0, z: 1e300 },
  });
  TestValidator.predicate(
    "tiny noncollinear sample and near-parallel target retain scale",
    nclose(tinyPlaced[0].x / scale, -1 / 3) &&
      nclose(tinyPlaced[0].y / scale, -1 / 3) &&
      nclose(tinyPlaced[1].x / scale, 2 / 3) &&
      nclose(tinyPlaced[2].y / scale, 2 / 3) &&
      nclose(tinyPlaced[2].z / scale, 0),
  );
}
