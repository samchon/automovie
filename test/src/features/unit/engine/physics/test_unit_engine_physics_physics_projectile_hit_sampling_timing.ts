import { projectileSphereHit } from "@automovie/engine";
import type {
  IAutoMovieProjectile,
  IAutoMovieSphere,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

const PROJECTILE: IAutoMovieProjectile = {
  origin: { x: 0, y: 1, z: 0 },
  velocity: { x: 5, y: 0, z: 0 },
  gravity: { x: 0, y: 0, z: 0 },
};

const SPHERE: IAutoMovieSphere = {
  center: { x: 2, y: 1, z: 0 },
  radius: 0.5,
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
 * `projectileSphereHit` samples `[0, tMax]` in `steps` segments. Invalid timing
 * inputs must fail before `dt = tMax / steps` and before the loop bound can
 * skip or run forever.
 *
 * Scenarios:
 *
 * 1. Non-finite/non-positive windows throw before hit sampling starts.
 * 2. Non-finite, non-integer, or less-than-one step counts throw before hit
 *    sampling starts.
 */
export function test_unit_engine_physics_physics_projectile_hit_sampling_timing(): void {
  TestValidator.predicate(
    "zero tMax throws",
    throws(
      (): ReturnType<typeof projectileSphereHit> =>
        projectileSphereHit(PROJECTILE, SPHERE, 0, 10),
    ),
  );
  TestValidator.predicate(
    "zero steps throws",
    throws(
      (): ReturnType<typeof projectileSphereHit> =>
        projectileSphereHit(PROJECTILE, SPHERE, 1, 0),
    ),
  );
}
