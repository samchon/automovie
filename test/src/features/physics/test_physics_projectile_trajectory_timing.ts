import { IAutoMovieProjectile, projectileTrajectory } from "@automovie/engine";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Requests trajectory clips with invalid duration or frame rate and requires exceptions, catching admission that silently emits empty or malformed sampled clips.
 * @evidence contracts/testing.md#independent-expectations Positive finite seconds and frames per second are the declared sampling contract; the expected failure does not come from a generated clip. Exception type and internal evaluation order are not asserted.
 * @evidence contracts/testing.md#distinguishing-cases Tests NaN, infinity and zero independently for duration and fps; valid sample values, endpoint inclusion and facing belong to the trajectory unit.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit calls the clip producer with an in-memory projectile and owns all assertions without a renderer, host or dynamic cases.
 */
export function test_physics_projectile_trajectory_timing(): void {
  TestValidator.predicate(
    "nan duration throws",
    throws(
      (): ReturnType<typeof projectileTrajectory> =>
        projectileTrajectory("arrow", PROJECTILE, Number.NaN, 30),
    ),
  );
  TestValidator.predicate(
    "infinite duration throws",
    throws(
      (): ReturnType<typeof projectileTrajectory> =>
        projectileTrajectory("arrow", PROJECTILE, Infinity, 30),
    ),
  );
  TestValidator.predicate(
    "zero duration throws",
    throws(
      (): ReturnType<typeof projectileTrajectory> =>
        projectileTrajectory("arrow", PROJECTILE, 0, 30),
    ),
  );
  TestValidator.predicate(
    "nan fps throws",
    throws(
      (): ReturnType<typeof projectileTrajectory> =>
        projectileTrajectory("arrow", PROJECTILE, 1, Number.NaN),
    ),
  );
  TestValidator.predicate(
    "infinite fps throws",
    throws(
      (): ReturnType<typeof projectileTrajectory> =>
        projectileTrajectory("arrow", PROJECTILE, 1, Infinity),
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
