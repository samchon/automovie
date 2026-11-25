import { normalizeAutoMovieSurfaceFrame } from "@automovie/engine";
import type {
  IAutoMovieSurfaceFrame,
  IAutoMovieSweepFrame,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError, vclose } from "../../internal/predicates";

/**
 * `normalizeAutoMovieSurfaceFrame` turns an (origin, forward, normal) request
 * into the normal-priority orthonormal basis: the normal kept, the forward
 * projected off it, never scaled.
 *
 * Fixture: origin (3, -2, 5), forward (4, 6, 8) and normal (0, 3, 4): the
 * normal is (0, 0.6, 0.8), the forward projected and normalized (1, 0, 0) is
 * x, and y = normal x x is (0, 0.8, -0.6).
 *
 * Scenarios:
 *
 * 1. The basis is the origin, x (1,0,0), y (0,0.8,-0.6) and normal (0,0.6,0.8),
 *    the same for directions scaled by 1e-300, 1 and 1e300.
 * 2. The reversed normal flips y and the normal and keeps x.
 * 3. A forward of (1e-300, 0, 1) against the normal +z keeps x = +x and y = +y.
 * 4. A zero forward or normal, and a forward parallel or antiparallel to the
 *    normal, are refused.
 * 5. Editing a result touches no caller record; later edits of the request are
 *    read by the next call (origin y 7, forward x -4: x = -x, y = (0, -0.8,
 *    0.6)) without changing an earlier result.
 */
export function test_engine_geometry_normalize_surface_frame(): void {
  const origin: IAutoMovieVector3 = { x: 3, y: -2, z: 5 };
  const forward: IAutoMovieVector3 = { x: 4, y: 6, z: 8 };
  const normal: IAutoMovieVector3 = { x: 0, y: 3, z: 4 };
  const request: IAutoMovieSurfaceFrame = { origin, forward, normal };
  const basis = (
    frame: IAutoMovieSweepFrame,
    x: IAutoMovieVector3,
    y: IAutoMovieVector3,
    n: IAutoMovieVector3,
  ): boolean => vclose(frame.x, x) && vclose(frame.y, y) && vclose(frame.normal, n);
  const X: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const Y: IAutoMovieVector3 = { x: 0, y: 0.8, z: -0.6 };
  const N: IAutoMovieVector3 = { x: 0, y: 0.6, z: 0.8 };

  // 1.
  const result: IAutoMovieSweepFrame = normalizeAutoMovieSurfaceFrame(request);
  TestValidator.predicate("basis", vclose(result.origin, origin) && basis(result, X, Y, N));
  for (const k of [1e-300, 1, 1e300])
    TestValidator.predicate(
      `scaled ${k}`,
      basis(
        normalizeAutoMovieSurfaceFrame({
          origin,
          forward: { x: 4 * k, y: 6 * k, z: 8 * k },
          normal: { x: 0, y: 3 * k, z: 4 * k },
        }),
        X,
        Y,
        N,
      ),
    );

  // 2.
  TestValidator.predicate(
    "reversed normal",
    basis(
      normalizeAutoMovieSurfaceFrame({ ...request, normal: { x: 0, y: -3, z: -4 } }),
      X,
      { x: 0, y: -0.8, z: 0.6 },
      { x: 0, y: -0.6, z: -0.8 },
    ),
  );

  // 3.
  TestValidator.predicate(
    "near parallel",
    basis(
      normalizeAutoMovieSurfaceFrame({
        origin,
        forward: { x: 1e-300, y: 0, z: 1 },
        normal: { x: 0, y: 0, z: 1 },
      }),
      X,
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
    ),
  );

  // 4.
  for (const frame of [
    { ...request, forward: { x: 0, y: 0, z: 0 } },
    { ...request, normal: { x: 0, y: 0, z: 0 } },
    { ...request, forward: { x: 0, y: 3, z: 4 } },
    { ...request, forward: { x: 0, y: -6, z: -8 } },
  ])
    TestValidator.predicate(
      "refused",
      throwsError((): IAutoMovieSweepFrame => normalizeAutoMovieSurfaceFrame(frame)),
    );

  // 5.
  result.origin.x = 999;
  result.x.y = 999;
  result.y.z = 999;
  result.normal.x = 999;
  TestValidator.predicate(
    "no alias",
    vclose(origin, { x: 3, y: -2, z: 5 }) &&
      vclose(forward, { x: 4, y: 6, z: 8 }) &&
      vclose(normal, { x: 0, y: 3, z: 4 }),
  );
  const retained: IAutoMovieSweepFrame = normalizeAutoMovieSurfaceFrame(request);
  origin.y = 7;
  forward.x = -4;
  const changed: IAutoMovieSweepFrame = normalizeAutoMovieSurfaceFrame(request);
  TestValidator.predicate(
    "reads current records",
    vclose(retained.origin, { x: 3, y: -2, z: 5 }) &&
      vclose(retained.x, X) &&
      vclose(changed.origin, { x: 3, y: 7, z: 5 }) &&
      vclose(changed.x, { x: -1, y: 0, z: 0 }) &&
      vclose(changed.y, { x: 0, y: -0.8, z: 0.6 }),
  );
}
