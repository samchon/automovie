import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  projectileAt,
} from "@automovie/engine";
import type {
  IAutoMovieProjectile,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A projectile's attitude (#3478): a spin turns the body at its rate while
 * the centre follows the same path as a velocity attitude.
 *
 * Scenarios:
 *
 * 1. A spin of 720 degrees a second about the body's X turns the body's +Y
 *    by 720 degrees in one second: back on itself, within 1e-9 rad, and by
 *    90 degrees in an eighth of a second.
 * 2. The centre of a spinning flight equals the centre of a velocity-attitude
 *    flight of the same launch at 10 instants.
 * 3. A velocity attitude points the body's +Z along the velocity.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the spun axis at two instants, the centres of two attitudes and the velocity attitude's nose; a spin in the wrong unit, an attitude that moves the centre or a nose off the velocity fails.
 * @evidence contracts/development/testing.md#independent-expectations The turned angles are the rate times the time, written here.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a spin, a velocity attitude and their shared centre.
 * @evidence contracts/development/testing.md#execution-ownership The named unit calls the engine's flight reader directly.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three numbered scenarios with their inputs and bounds.
 */
export function test_physics_projectile_attitude(): void {
  const launch = {
    origin: { x: 0, y: 1.5, z: 0 },
    velocity: { x: 0, y: 3, z: 9 },
    gravity: AutoMovieGravity.DOWN,
  };
  const spun: IAutoMovieProjectile = {
    ...launch,
    attitude: { kind: "spin", axis: { x: 1, y: 0, z: 0 }, rate: 720 },
  };
  const nosed: IAutoMovieProjectile = {
    ...launch,
    attitude: { kind: "velocity" },
  };
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const angle = (t: number): number => {
    const turned: IAutoMovieVector3 = Quaternion.rotateVector(
      projectileAt(spun, t).rotation!,
      up,
    );
    return Math.acos(Math.max(-1, Math.min(1, Vector3.dot(turned, up))));
  };

  // 1. 720 degrees in a second, 90 in an eighth.
  TestValidator.predicate(
    `two whole turns in a second (${angle(1).toExponential(2)} rad off)`,
    angle(1) <= 1e-9,
  );
  TestValidator.predicate(
    "a quarter turn in an eighth of a second",
    Math.abs(angle(0.125) - Math.PI / 2) <= 1e-9,
  );

  // 2. The same centre.
  let worst: number = 0;
  for (let k: number = 0; k < 10; k++)
    worst = Math.max(
      worst,
      Vector3.length(
        Vector3.subtract(
          projectileAt(spun, k / 10).position,
          projectileAt(nosed, k / 10).position,
        ),
      ),
    );
  TestValidator.predicate("the attitude leaves the centre's path", worst === 0);

  // 3. The nose along the velocity.
  const state = projectileAt(nosed, 0.4);
  const nose: IAutoMovieVector3 = Quaternion.rotateVector(state.rotation!, {
    x: 0,
    y: 0,
    z: 1,
  });
  TestValidator.predicate(
    "a velocity attitude noses along the flight",
    Vector3.dot(nose, Vector3.normalize(state.velocity)) >= 1 - 1e-9,
  );
}
