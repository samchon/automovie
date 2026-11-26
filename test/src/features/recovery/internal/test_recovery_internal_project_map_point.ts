import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `projectRecoveryMapPoint` projects a world point through a row-major
 * intrinsic matrix and differentiates the pixel in a left rotation increment
 * and an additive camera-frame translation, and in the world point.
 *
 * Scenarios:
 *
 * 1. The identity pose at t = (0, 0, 2), the point (1, 2, 0) and the intrinsics
 *    fx = 100, cx = 50, fy = 200, cy = 60 give camera coordinates (1, 2, 2),
 *    pixel (100, 260) and depth 2. The point rows are the chart rows (50, 0,
 *    -25) and (0, 100, -100); the camera rows lay the rotation part -chart *
 *    skew((1, 2, 0)) before the translation part, which is the chart.
 * 2. A point behind the camera has no projection.
 */
export function test_recovery_internal_project_map_point(): void {
  const intrinsic: number[] = [100, 0, 50, 0, 200, 60, 0, 0, 1];
  const identity: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const projection: ReturnType<typeof AutoMovieRecoveryCameraMap.projectMapPoint> =
    AutoMovieRecoveryCameraMap.projectMapPoint(
      { rotation: identity, translation: [0, 0, 2] },
      [1, 2, 0],
      intrinsic,
    );
  const close = (actual: readonly number[], expected: number[]): boolean =>
    actual.length === expected.length &&
    actual.every((value: number, at: number): boolean =>
      nclose(value, expected[at]!, 1e-12),
    );
  TestValidator.predicate("a projection exists", projection !== null);
  TestValidator.predicate(
    "the pixel",
    close(projection!.pixel, [100, 260]),
  );
  TestValidator.equals("the depth", projection!.depth, 2);
  TestValidator.predicate(
    "the point rows",
    close(projection!.pointJacobian[0]!, [50, 0, -25]) &&
      close(projection!.pointJacobian[1]!, [0, 100, -100]),
  );
  TestValidator.predicate(
    "the camera rows",
    close(projection!.cameraJacobian[0]!, [-50, 25, -100, 50, 0, -25]) &&
      close(projection!.cameraJacobian[1]!, [-200, 100, 100, 0, 100, -100]),
  );
  TestValidator.equals(
    "a point behind the camera",
    AutoMovieRecoveryCameraMap.projectMapPoint(
      { rotation: identity, translation: [0, 0, -1] },
      [0, 0, 0],
      intrinsic,
    ),
    null,
  );
}
