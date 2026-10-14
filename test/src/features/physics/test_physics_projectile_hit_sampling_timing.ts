import {
  IAutoMovieProjectile,
  IAutoMovieSphere,
  projectileSphereHit,
} from "@automovie/engine";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls sampled sphere collision with invalid windows or step counts and requires an exception, catching skipped or unbounded sampling from an invalid loop clock.
 * @evidence contracts/testing.md#independent-expectations Positive finite windows and positive integer subdivision counts are the API admission contract; exception presence is expected independently of product arithmetic. The assertions do not establish exception identity or that no internal arithmetic occurred.
 * @evidence contracts/testing.md#distinguishing-cases Covers NaN, infinity and zero windows plus NaN, infinity, zero and fractional steps; collision success and collider admission belong to neighboring units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns all cases and calls the engine with authored projectile/sphere records; it starts no host or dynamic registration.
 */
export function test_physics_projectile_hit_sampling_timing(): void {
  TestValidator.predicate(
    "nan tMax throws",
    throws((): ReturnType<typeof projectileSphereHit> => projectileSphereHit(PROJECTILE, SPHERE, Number.NaN, 10)),
  );
  TestValidator.predicate(
    "infinite tMax throws",
    throws((): ReturnType<typeof projectileSphereHit> => projectileSphereHit(PROJECTILE, SPHERE, Infinity, 10)),
  );
  TestValidator.predicate(
    "zero tMax throws",
    throws((): ReturnType<typeof projectileSphereHit> => projectileSphereHit(PROJECTILE, SPHERE, 0, 10)),
  );
  TestValidator.predicate(
    "nan steps throws",
    throws((): ReturnType<typeof projectileSphereHit> => projectileSphereHit(PROJECTILE, SPHERE, 1, Number.NaN)),
  );
  TestValidator.predicate(
    "infinite steps throws",
    throws((): ReturnType<typeof projectileSphereHit> => projectileSphereHit(PROJECTILE, SPHERE, 1, Infinity)),
  );
  TestValidator.predicate(
    "zero steps throws",
    throws((): ReturnType<typeof projectileSphereHit> => projectileSphereHit(PROJECTILE, SPHERE, 1, 0)),
  );
  TestValidator.predicate(
    "fractional steps throws",
    throws((): ReturnType<typeof projectileSphereHit> => projectileSphereHit(PROJECTILE, SPHERE, 1, 0.5)),
  );
}
