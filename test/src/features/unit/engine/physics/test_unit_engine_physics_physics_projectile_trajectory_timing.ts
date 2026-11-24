import { projectileTrajectory } from "@automovie/engine";
import type { IAutoMovieProjectile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

const PROJECTILE: IAutoMovieProjectile = {
  origin: { x: 0, y: 1, z: 0 },
  velocity: { x: 5, y: 8, z: 0 },
  gravity: { x: 0, y: -9.81, z: 0 },
};

const throws: (task: () => void) => boolean = (task: () => void): boolean => {
  try {
    task();
    return false;
  } catch {
    return true;
  }
};

/**
 * `projectileTrajectory` derives its key count from `duration * fps`. Invalid
 * timing scalars must fail before that multiplication can produce `NaN` counts
 * or unbounded sampling.
 *
 * Scenarios:
 *
 * 1. Non-finite/non-positive duration and frame rate values all throw.
 */
export function test_unit_engine_physics_physics_projectile_trajectory_timing(): void {
  TestValidator.predicate(
    "zero duration throws",
    throws(
      (): ReturnType<typeof projectileTrajectory> =>
        projectileTrajectory("arrow", PROJECTILE, 0, 30),
    ),
  );
  TestValidator.predicate(
    "zero fps throws",
    throws(
      (): ReturnType<typeof projectileTrajectory> =>
        projectileTrajectory("arrow", PROJECTILE, 1, 0),
    ),
  );
}
