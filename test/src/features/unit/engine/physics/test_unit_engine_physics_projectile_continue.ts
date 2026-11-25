import { projectileContinue } from "@automovie/engine";
import type {
  IAutoMovieHit,
  IAutoMovieProjectile,
  IAutoMovieProjectileContinue,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../../../internal/predicates";

/** Standard gravity, metres per second squared. */
const G: number = 9.80665;

/** Whether a continuation throws a range error naming a field. */
function refusedOn(run: () => unknown, field: string): boolean {
  try {
    run();
  } catch (error: unknown) {
    return error instanceof RangeError && error.message.includes(field);
  }
  return false;
}

/**
 * `projectileContinue` continues a flight after a hit: a bounce reflects the
 * normal velocity by the restitution and rolls instead when the rebound would
 * rise no higher than the roll radius under gravity pressing it into the
 * surface; a surface pushes, never pulls, so a rebound off a ceiling falls away
 * and a roll against outward gravity is refused.
 *
 * Scenarios:
 *
 * 1. At restitution 1, a 0.1 m/s ceiling hit with a 0.1 m roll radius leaves at
 *    -0.1 m/s and falls; the floor's twin rises only `0.1^2 / 2g`, under the
 *    radius, and rolls decelerating at `0.1 g`; with no gravity a ceiling
 *    bounce stays in flight and a 2 m/s tangential roll keeps its speed, moving
 *    2 m in 1 s; an explicit ceiling roll is refused.
 * 2. Over a floor under gravity of -8, 0 or 8: a negative radius or resistance is
 *    refused even where the rebound stays in flight; no roll, a radius of 0 or
 *    one of 0.25, the rebound's height `2^2 / 16`, stays in flight at (3, 2,
 *    0); a radius of 0.5 rolls at (3, 0, 0), decelerating at `8 r` for a
 *    resistance of 0 or 2.
 */
export function test_unit_engine_physics_projectile_continue(): void {
  // 1. A surface pushes, never pulls.
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const gravity: IAutoMovieVector3 = { x: 0, y: -G, z: 0 };
  const ceiling: IAutoMovieProjectile = {
    origin: { x: 0, y: 10, z: 0 },
    velocity: { x: 0, y: 0.1, z: 0 },
    gravity,
  };
  const hit: IAutoMovieHit = {
    time: 0,
    point: ceiling.origin,
    normal: { x: 0, y: -1, z: 0 },
    collider: "ceiling",
  };
  const bounce: IAutoMovieProjectileContinue.Outcome = {
    kind: "bounce",
    restitution: 1,
    friction: 0,
    roll: { radius: 0.1, resistance: 0.1 },
  };
  const away = projectileContinue(ceiling, hit, bounce);
  const floor = projectileContinue(
    { origin: zero, velocity: { x: 0, y: -0.1, z: 0 }, gravity },
    { ...hit, point: zero, normal: { x: 0, y: 1, z: 0 }, collider: "floor" },
    bounce,
  );
  const neutral = projectileContinue(
    { ...ceiling, gravity: zero },
    hit,
    bounce,
  );
  const rolling = projectileContinue(
    { ...ceiling, gravity: zero, velocity: { x: 2, y: 0, z: 0 } },
    hit,
    { kind: "roll", resistance: 0.1 },
  );
  const rolled = projectileContinue.at(rolling, 1);
  TestValidator.predicate(
    "a surface pushes",
    away.kind === "flight" &&
      nclose(away.projectile.velocity.y, -0.1, 0) &&
      projectileContinue.at(away, 1).position.y < 10 &&
      floor.kind === "roll" &&
      nclose(floor.deceleration, 0.1 * G, 0) &&
      neutral.kind === "flight" &&
      nclose(neutral.projectile.velocity.y, -0.1, 0) &&
      rolling.kind === "roll" &&
      nclose(rolling.deceleration, 0, 0) &&
      vclose(rolled.position, { x: 2, y: 10, z: 0 }, 0) &&
      nclose(rolled.velocity.x, 2, 0),
  );
  let refused: boolean = false;
  try {
    projectileContinue(ceiling, hit, { kind: "roll", resistance: 0.1 });
  } catch (error: unknown) {
    refused = error instanceof RangeError;
  }
  TestValidator.predicate("never pulls", refused);

  // 2. The roll's admission.
  const flight: IAutoMovieProjectile = {
    origin: zero,
    velocity: { x: 3, y: -2, z: 0 },
    gravity: { x: 0, y: -8, z: 0 },
  };
  const ground: IAutoMovieHit = {
    time: 0,
    point: zero,
    normal: { x: 0, y: 1, z: 0 },
  };
  const under = (y: number): IAutoMovieProjectile => ({
    ...flight,
    gravity: { x: 0, y, z: 0 },
  });
  const outcome = (roll?: {
    radius: number;
    resistance: number;
  }): IAutoMovieProjectileContinue.Outcome => ({
    kind: "bounce",
    restitution: 1,
    friction: 0,
    ...(roll === undefined ? {} : { roll }),
  });
  let admitted: boolean = true;
  for (const y of [-8, 0, 8]) {
    for (const field of ["radius", "resistance"] as const)
      admitted &&= refusedOn(
        () =>
          projectileContinue(
            under(y),
            ground,
            outcome({
              radius: 0.125,
              resistance: 0.5,
              [field]: -Number.MIN_VALUE,
            }),
          ),
        field,
      );
    for (const radius of [undefined, 0, 0.25]) {
      const continued = projectileContinue(
        under(y),
        ground,
        outcome(radius === undefined ? undefined : { radius, resistance: 2 }),
      );
      admitted &&=
        continued.kind === "flight" &&
        vclose(continued.projectile.velocity, { x: 3, y: 2, z: 0 }, 0);
    }
  }
  for (const resistance of [0, 2]) {
    const continued = projectileContinue(
      flight,
      ground,
      outcome({ radius: 0.5, resistance }),
    );
    admitted &&=
      continued.kind === "roll" &&
      vclose(continued.velocity, { x: 3, y: 0, z: 0 }, 0) &&
      nclose(continued.deceleration, resistance * 8, 0);
  }
  TestValidator.predicate("the roll's admission", admitted);
}
