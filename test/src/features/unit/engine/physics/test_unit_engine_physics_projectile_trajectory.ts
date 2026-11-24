import { projectileTrajectory } from "@automovie/engine";
import type { IAutoMovieProjectile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `projectileTrajectory` derives its key count from duration times frame rate,
 * so a duration or a frame rate of zero is refused.
 *
 * Projectile: from (0,1,0) at (5,8,0) m/s under -9.81 m/s^2.
 *
 * Scenarios:
 *
 * 1. A zero duration is refused.
 * 2. A zero frame rate is refused.
 */
export function test_unit_engine_physics_projectile_trajectory(): void {
  const projectile: IAutoMovieProjectile = {
    origin: { x: 0, y: 1, z: 0 },
    velocity: { x: 5, y: 8, z: 0 },
    gravity: { x: 0, y: -9.81, z: 0 },
  };
  TestValidator.predicate(
    "zero duration",
    throwsError(() => projectileTrajectory("arrow", projectile, 0, 30)),
  );
  TestValidator.predicate(
    "zero fps",
    throwsError(() => projectileTrajectory("arrow", projectile, 1, 0)),
  );
}
