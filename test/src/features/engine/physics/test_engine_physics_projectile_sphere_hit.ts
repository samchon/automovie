import { AutoMoviePhysicalProjectile } from "@automovie/engine";
import type {
  IAutoMovieProjectile,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/** How far a hit point may lie past the sphere's surface, metres. */
const SURFACE: number = 1e-3;

/**
 * `AutoMoviePhysicalProjectile.sphereHit` samples a flight over `[0, tMax]` in `steps` segments
 * and returns the first sample segment's entry into a sphere: the surface
 * crossing, before the centre's.
 *
 * Scenarios:
 *
 * 1. A flight from the origin at (10, 5, 0) under (0, -10, 0) passes through (10,
 *    0, 0) at 1 s; a unit sphere there is entered after 0.8 s and by 1 s, at a
 *    point on its surface; a sphere 50 m up is never hit.
 * 2. A zero window, zero steps, or a sphere of radius -1 is refused.
 */
export function test_engine_physics_projectile_sphere_hit(): void {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const arc: IAutoMovieProjectile = {
    origin: zero,
    velocity: { x: 10, y: 5, z: 0 },
    gravity: { x: 0, y: -10, z: 0 },
  };
  const hit = AutoMoviePhysicalProjectile.sphereHit(
    arc,
    { center: { x: 10, y: 0, z: 0 }, radius: 1 },
    2,
  );
  TestValidator.predicate(
    "the surface crossing",
    hit !== null &&
      hit.time > 0.8 &&
      hit.time <= 1 &&
      Math.hypot(hit.point.x - 10, hit.point.y, hit.point.z) <= 1 + SURFACE,
  );
  TestValidator.equals(
    "nothing on the path",
    AutoMoviePhysicalProjectile.sphereHit(arc, { center: { x: 0, y: 50, z: 0 }, radius: 1 }, 2),
    null,
  );
  const line: IAutoMovieProjectile = {
    origin: { x: 0, y: 1, z: 0 },
    velocity: { x: 5, y: 0, z: 0 },
    gravity: zero,
  };
  const sphere = { center: { x: 2, y: 1, z: 0 }, radius: 0.5 };
  TestValidator.equals(
    "refusals",
    [
      throwsError(() => AutoMoviePhysicalProjectile.sphereHit(line, sphere, 0, 10)),
      throwsError(() => AutoMoviePhysicalProjectile.sphereHit(line, sphere, 1, 0)),
      throwsError(() =>
        AutoMoviePhysicalProjectile.sphereHit(line, { ...sphere, radius: -1 }, 1, 10),
      ),
    ],
    [true, true, true],
  );
}
