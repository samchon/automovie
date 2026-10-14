import { intersectsPerspectiveFrustumSphere } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

const camera: Parameters<
  typeof intersectsPerspectiveFrustumSphere
>[0]["camera"] = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

const visible: (
  center: { x: number; y: number; z: number },
  radius: number,
) => boolean = (
  center: { x: number; y: number; z: number },
  radius: number,
): boolean =>
  intersectsPerspectiveFrustumSphere({
    camera,
    center,
    radius,
    near: 1,
    far: 10,
    halfY: 0.5,
    aspect: 2,
  });

/**
 * Perspective sphere visibility uses normalized frustum-plane distances.
 *
 * Scenarios:
 *
 * 1. An interior point remains visible.
 * 2. Horizontal and vertical tangent spheres intersect exactly, while a center
 *    beyond the plane-normalized radius is rejected.
 * 3. Near/far tangent spheres intersect and separated spheres do not.
 * 4. Camera translation/rotation resolves the same local-space result.
 * 5. Negative and non-finite radii fail closed.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls intersectsPerspectiveFrustumSphere at inside, tangent, separated and transformed placements and checks booleans, catching radius padding in projected coordinates instead of normalized plane distance or failure to transform the sphere into camera space.
 * @evidence contracts/testing.md#independent-expectations At depth five, the horizontal slope one and vertical slope one-half give tangencies x=5+sqrt(2) and y=2.5+hypot(1,0.5) for radius one; near/far tangencies follow depth plus or minus radius. Literal 0.001 displacements distinguish separation, and the authored quarter-turn camera places its center five metres forward independently of the predicate.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the five groups: interior point, horizontal/vertical tangencies and separated neighbours, near/far tangencies and neighbours, translated/rotated camera, and negative/NaN radii. Cropped gates and conservative corner false positives are outside these assertions.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_camera_projection_sphere entry owns every direct scalar/vector predicate call and lazy boolean observation in-process, without a real camera host, browser, GPU, installed consumer or native artifact.
 */
export function test_film_camera_projection_sphere(): void {
  const horizontalTangent: number = 5 + Math.SQRT2;
  const verticalTangent: number = 2.5 + Math.hypot(1, 0.5);
  TestValidator.equals(
    "perspective side planes use exact normalized sphere distance",
    namedFacts([
      ["visibleXY", (): boolean => visible({ x: 0, y: 0, z: -5 }, 0)],
      [
        "visibleXHorizontalTangent",
        (): boolean => visible({ x: horizontalTangent, y: 0, z: -5 }, 1),
      ],
      [
        "visibleXHorizontalTangent2",
        (): boolean =>
          visible({ x: horizontalTangent + 0.001, y: 0, z: -5 }, 1) === false,
      ],
      [
        "visibleXY2",
        (): boolean => visible({ x: 0, y: verticalTangent, z: -5 }, 1),
      ],
      [
        "visibleXY3",
        (): boolean =>
          visible({ x: 0, y: verticalTangent + 0.001, z: -5 }, 1) === false,
      ],
    ]),
    {
      visibleXY: true,
      visibleXHorizontalTangent: true,
      visibleXHorizontalTangent2: true,
      visibleXY2: true,
      visibleXY3: true,
    },
  );
  TestValidator.equals(
    "near and far planes include tangent spheres only",
    namedFacts([
      ["visibleXY", (): boolean => visible({ x: 0, y: 0, z: -0.5 }, 0.5)],
      [
        "visibleXY2",
        (): boolean => visible({ x: 0, y: 0, z: -0.499 }, 0.5) === false,
      ],
      ["visibleXY3", (): boolean => visible({ x: 0, y: 0, z: -10.5 }, 0.5)],
      [
        "visibleXY4",
        (): boolean => visible({ x: 0, y: 0, z: -10.501 }, 0.5) === false,
      ],
    ]),
    { visibleXY: true, visibleXY2: true, visibleXY3: true, visibleXY4: true },
  );
  const half: number = Math.SQRT1_2;
  TestValidator.predicate(
    "camera world placement resolves before the shared frustum test",
    intersectsPerspectiveFrustumSphere({
      camera: {
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 0, y: half, z: 0, w: half },
      },
      center: { x: -4, y: 2, z: 3 },
      radius: 0,
      near: 1,
      far: 10,
      halfY: 0.5,
      aspect: 2,
    }),
  );
  TestValidator.equals(
    "invalid sphere radii fail closed",
    namedFacts([
      [
        "negativeRadiusRejected",
        (): boolean => visible({ x: 0, y: 0, z: -5 }, -1) === false,
      ],
      [
        "nonFiniteRadiusRejected",
        (): boolean => visible({ x: 0, y: 0, z: -5 }, Number.NaN) === false,
      ],
    ]),
    { negativeRadiusRejected: true, nonFiniteRadiusRejected: true },
  );
}
