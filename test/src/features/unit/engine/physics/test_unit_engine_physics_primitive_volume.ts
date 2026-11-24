import { primitiveCentroid, primitiveVolume } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

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
 */
export function test_unit_engine_physics_primitive_volume(): void {
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
}
