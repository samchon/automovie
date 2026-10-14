import { IAutoMovieProjectile, projectileAt } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const PROJECTILE: IAutoMovieProjectile = {
  origin: { x: 1, y: 2, z: 3 },
  velocity: { x: 4, y: 5, z: 6 },
  gravity: { x: 0, y: -10, z: 2 },
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
 * `projectileAt` is the public closed-form evaluator for projectile state.
 * Every scalar input must be finite; this admission does not guarantee that
 * arbitrarily large finite arithmetic cannot overflow.
 *
 * Scenarios:
 *
 * 1. Non-finite time and projectile vector components throw before evaluation.
 * 2. Finite projectile state still follows the closed-form ballistic equation.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates invalid times and origin/velocity/gravity components expecting throws, then checks a finite two-second state so admission cannot reject every request.
 * @evidence contracts/testing.md#independent-expectations Finite-input admission supplies the refusal contract and hand substitution into constant-acceleration equations gives position (9,-8,19) and velocity (4,-15,10). The assertions establish exception presence, not type, identity or extreme-finite overflow safety.
 * @evidence contracts/testing.md#distinguishing-cases Covers NaN/infinite time and distinct invalid vector components plus a finite positive twin with acceleration on two axes; other elapsed-time/apex cases belong to the projectile unit.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit calls the evaluator with local records and owns every assertion, starting no host or dynamically registered case.
 */
export function test_physics_projectile_state_finite(): void {
  TestValidator.predicate(
    "nan time throws",
    throws(
      (): ReturnType<typeof projectileAt> =>
        projectileAt(PROJECTILE, Number.NaN),
    ),
  );
  TestValidator.predicate(
    "infinite time throws",
    throws(
      (): ReturnType<typeof projectileAt> => projectileAt(PROJECTILE, Infinity),
    ),
  );
  TestValidator.predicate(
    "non-finite origin throws",
    throws(
      (): ReturnType<typeof projectileAt> =>
        projectileAt(
          { ...PROJECTILE, origin: { ...PROJECTILE.origin, x: Number.NaN } },
          1,
        ),
    ),
  );
  TestValidator.predicate(
    "non-finite velocity throws",
    throws(
      (): ReturnType<typeof projectileAt> =>
        projectileAt(
          { ...PROJECTILE, velocity: { ...PROJECTILE.velocity, y: Infinity } },
          1,
        ),
    ),
  );
  TestValidator.predicate(
    "non-finite gravity throws",
    throws(
      (): ReturnType<typeof projectileAt> =>
        projectileAt(
          { ...PROJECTILE, gravity: { ...PROJECTILE.gravity, z: -Infinity } },
          1,
        ),
    ),
  );

  const state: ReturnType<typeof projectileAt> = projectileAt(PROJECTILE, 2);
  TestValidator.predicate(
    "finite position follows closed-form projectile equation",
    nclose(state.position.x, 9) &&
      nclose(state.position.y, -8) &&
      nclose(state.position.z, 19),
  );
  TestValidator.predicate(
    "finite velocity follows closed-form projectile equation",
    nclose(state.velocity.x, 4) &&
      nclose(state.velocity.y, -15) &&
      nclose(state.velocity.z, 10),
  );
}
