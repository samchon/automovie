import { projectileAt, projectileFirstContact } from "@automovie/engine";
import type {
  IAutoMovieHit,
  IAutoMovieProjectile,
  IAutoMovieProjectileFirstContact,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A force-law outgoing velocity cannot certify a nonmonotone dense cubic.
 *
 * Scenarios:
 * 1. A zero-gravity drag launch has h*k*v=12/5. Its first RK4 knot has
 *    displacement coefficient 13803/78125 and velocity coefficient
 *    25142305373/30517578125. The Hermite position at phase .3 is higher
 *    than at .15, but at .75 is lower, despite positive velocity at .15.
 * 2. A plane at the phase-.15 position is initially touching. Because this
 *    dense interval has a negative derivative control, a resolved-contact
 *    query must conservatively retain that initial contact, not claim that
 *    the plane can never be entered again.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the independent rational RK4 coefficients, sampled dense ordering and the public initial-contact fallback being verified.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public projectileAt and projectileFirstContact on the same admitted drag flight; a false no-entry certificate is observed as a missing contact rather than through a private helper.
 * @evidence contracts/development/testing.md#independent-expectations The q=12/5 RK4 recurrence gives the stated rational endpoint coefficients. Hermite values at .15/.3/.75 have strictly separated ordering; the fixed plane is authored at the actual initial point and unresolved certification must return the exact query start.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive initial velocity and zero normal gravity contrast with actual outward-then-inward dense positions; touching with a resolved id contrasts with the previous erroneous permanent suppression.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous unit owns immutable flight and plane records; it uses public engine seams without a patched solver, private import, process or renderer.
 */
export function test_physics_projectile_dense_departure(): void {
  const step: number = 1 / 60;
  const speed: number = 1e-6;
  const drag: number = 12 / 5 / (step * speed);
  const launch: IAutoMovieProjectile = {
    origin: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: speed, z: 0 },
    gravity: { x: 0, y: 0, z: 0 },
    drag: { coefficient: 2 * drag, area: 1, density: 1, mass: 1 },
  };
  const from: number = 0.15 * step;
  const start: IAutoMovieVector3 = projectileAt(launch, from).position;
  const middle: number = projectileAt(launch, 0.3 * step).position.y;
  const later: number = projectileAt(launch, 0.75 * step).position.y;
  const velocity: number = projectileAt(launch, from).velocity.y;
  const normal: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const plane: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.plane("dense-turn", start, normal);
  const hit: IAutoMovieHit | null = projectileFirstContact(
    launch,
    [plane],
    { from, to: 0.75 * step },
    { radius: 0, thickness: Number.MAX_VALUE, departing: plane.id },
  );
  TestValidator.predicate(
    "the independently derived dense reversal is present",
    velocity > 0 && middle > start.y && later < start.y,
  );
  TestValidator.predicate(
    "an uncertified dense turn retains the resolved initial contact",
    hit !== null && hit.collider === plane.id && hit.time === from,
  );
}
