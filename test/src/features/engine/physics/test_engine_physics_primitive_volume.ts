import { primitiveCentroid, primitiveVolume } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `primitiveVolume` is the analytic solid volume and `primitiveCentroid` the
 * local centroid of a primitive.
 *
 * Scenarios:
 *
 * 1. Box 2 x 3 x 4 is 24; unit-radius sphere is 4 pi / 3; radius 1 height 3
 *    cylinder is 3 pi; radius 3 height 2 cone is 6 pi; radius 1 height 2
 *    capsule is 2 pi + 4 pi / 3.
 * 2. Only a cone has an off-centre centroid: a cone of height 8 has it at y = 2;
 *    the others are at the origin.
 * 3. Radius 2 gives sphere 4/3 pi 8, cylinder (h 3) 12 pi, cone (h 3) 4 pi,
 *    capsule (h 3) 12 pi + 32 pi / 3; a plane has no volume; a cone of height 4
 *    has its centroid at y = 1 and a sphere at the origin.
 */
export function test_engine_physics_primitive_volume(): void {
  const close = (a: number, b: number): boolean => nclose(a, b, 1e-12);
  TestValidator.equals(
    "box",
    primitiveVolume({ type: "box", width: 2, height: 3, depth: 4 }),
    24,
  );
  TestValidator.predicate(
    "sphere",
    close(primitiveVolume({ type: "sphere", radius: 1 }), (4 * Math.PI) / 3),
  );
  TestValidator.predicate(
    "cylinder",
    close(
      primitiveVolume({ type: "cylinder", radius: 1, height: 3 }),
      3 * Math.PI,
    ),
  );
  TestValidator.predicate(
    "cone",
    close(primitiveVolume({ type: "cone", radius: 3, height: 2 }), 6 * Math.PI),
  );
  TestValidator.predicate(
    "capsule",
    close(
      primitiveVolume({ type: "capsule", radius: 1, height: 2 }),
      2 * Math.PI + (4 * Math.PI) / 3,
    ),
  );
  TestValidator.equals(
    "cone centroid",
    primitiveCentroid({ type: "cone", radius: 1, height: 8 }),
    { x: 0, y: 2, z: 0 },
  );
  TestValidator.equals(
    "box centroid",
    primitiveCentroid({ type: "box", width: 1, height: 1, depth: 1 }),
    { x: 0, y: 0, z: 0 },
  );
  TestValidator.predicate(
    "sphere r2",
    nclose(
      primitiveVolume({ type: "sphere", radius: 2 }),
      (4 / 3) * Math.PI * 8,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "cylinder r2",
    nclose(
      primitiveVolume({ type: "cylinder", radius: 2, height: 3 }),
      Math.PI * 4 * 3,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "cone r2",
    nclose(
      primitiveVolume({ type: "cone", radius: 2, height: 3 }),
      (1 / 3) * Math.PI * 4 * 3,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "capsule r2",
    nclose(
      primitiveVolume({ type: "capsule", radius: 2, height: 3 }),
      Math.PI * 4 * 3 + (4 / 3) * Math.PI * 8,
      1e-12,
    ),
  );
  TestValidator.equals(
    "plane",
    primitiveVolume({ type: "plane", width: 2, depth: 3 }),
    0,
  );
  TestValidator.equals(
    "cone centroid quarter",
    primitiveCentroid({ type: "cone", radius: 2, height: 4 }),
    { x: 0, y: 1, z: 0 },
  );
  TestValidator.equals(
    "sphere centroid",
    primitiveCentroid({ type: "sphere", radius: 2 }),
    { x: 0, y: 0, z: 0 },
  );
}
