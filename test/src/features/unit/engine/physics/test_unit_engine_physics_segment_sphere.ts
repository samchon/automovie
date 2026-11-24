import { projectileSphereHit, segmentSphere } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `segmentSphere` gives the parameter where a segment first meets a sphere;
 * `projectileSphereHit` samples it along a flight.
 *
 * Segment: (0,0,0) to (10,0,0). Sphere: centre (5,0,0), radius 1.
 *
 * Scenarios:
 *
 * 1. The segment enters the sphere at x = 4, parameter 0.4.
 * 2. A radius of 0 or -1 is refused by `segmentSphere`, and a radius of -1 is
 *    refused by `projectileSphereHit` through its sampled segment checks.
 */
export function test_unit_engine_physics_segment_sphere(): void {
  const start: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const end: IAutoMovieVector3 = { x: 10, y: 0, z: 0 };
  const center: IAutoMovieVector3 = { x: 5, y: 0, z: 0 };
  TestValidator.equals("entry", segmentSphere(start, end, center, 1), 0.4);
  for (const radius of [0, -1])
    TestValidator.predicate(
      `radius ${radius}`,
      throwsError(() => segmentSphere(start, end, center, radius)),
    );
  TestValidator.predicate(
    "projectile radius",
    throwsError(() =>
      projectileSphereHit(
        { origin: start, velocity: end, gravity: { x: 0, y: 0, z: 0 } },
        { center, radius: -1 },
        1,
        10,
      ),
    ),
  );
}
