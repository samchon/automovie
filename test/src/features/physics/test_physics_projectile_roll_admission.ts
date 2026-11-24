import { projectileContinue } from "@automovie/engine";
import type {
  IAutoMovieHit,
  IAutoMovieProjectile,
  IAutoMovieProjectileContinue,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * Bounce roll options are admitted even when the rebound remains a flight.
 *
 * Scenarios:
 * 1. Negative and nonfinite radius or resistance reject under inward, neutral and outward gravity.
 * 2. Omitted options, zero radius and a radius equal to rebound height preserve flight.
 * 3. A larger radius selects rolling, admitting zero resistance and resistance above one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the option admission matrix and the flight/roll boundaries with their units supplied by the fixtures.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public projectileContinue, checks RangeError and the offending coefficient name, then observes continuation kind, velocity and rolling deceleration. Invalid dormant options cannot pass merely because the roll branch was skipped.
 * @evidence contracts/development/testing.md#independent-expectations A frictionless elastic impact changes (3,-2,0) metres per second to (3,2,0). With inward gravity eight metres per second squared its rebound height is 2 squared divided by sixteen, or one quarter metre. Rolling removes normal speed and decelerates at resistance times eight. Exact binary inputs use zero tolerance; no implementation output supplies expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers each option independently with negative subnormal, NaN and both infinities across three gravity signs, plus absent options, zero radius, equal-height radius and roll activation with zero/two resistance. Existing projectile bounce and normal-gravity tests own other outcomes, explicit roll and repeated contacts.
 * @evidence contracts/development/testing.md#execution-ownership The named portable unit owns literal contact and projectile records and invokes the public continuation directly without a collider, renderer, global replacement or process.
 */
export function test_physics_projectile_roll_admission(): void {
  const flight: IAutoMovieProjectile = {
    origin: { x: 0, y: 0, z: 0 },
    velocity: { x: 3, y: -2, z: 0 },
    gravity: { x: 0, y: -8, z: 0 },
  };
  const hit: IAutoMovieHit = {
    time: 0,
    point: flight.origin,
    normal: { x: 0, y: 1, z: 0 },
  };
  const failures: string[] = [];

  for (const gravity of [-8, 0, 8])
    for (const field of ["radius", "resistance"] as const)
      for (const value of [-Number.MIN_VALUE]) {
        let refused: boolean = false;
        try {
          projectileContinue(
            { ...flight, gravity: { x: 0, y: gravity, z: 0 } },
            hit,
            {
              kind: "bounce",
              restitution: 1,
              friction: 0,
              roll: { radius: 0.125, resistance: 0.5, [field]: value },
            },
          );
        } catch (error) {
          refused =
            error instanceof RangeError && error.message.includes(field);
        }
        if (!refused)
          failures.push(
            `${field} ${value} under gravity ${gravity} was admitted`,
          );
      }

  for (const gravity of [-8, 0, 8])
    for (const radius of [undefined, 0, 0.25]) {
      try {
        const continued: IAutoMovieProjectileContinue.Segment =
          projectileContinue(
            { ...flight, gravity: { x: 0, y: gravity, z: 0 } },
            hit,
            {
              kind: "bounce",
              restitution: 1,
              friction: 0,
              ...(radius === undefined
                ? {}
                : { roll: { radius, resistance: 2 } }),
            },
          );
        if (
          continued.kind !== "flight" ||
          !vclose(continued.projectile.velocity, { x: 3, y: 2, z: 0 }, 0)
        )
          failures.push(`flight with radius ${radius}, gravity ${gravity}`);
      } catch (error) {
        failures.push(`valid flight options: ${String(error)}`);
      }
    }

  for (const resistance of [0, 2]) {
    try {
      const continued: IAutoMovieProjectileContinue.Segment =
        projectileContinue(flight, hit, {
          kind: "bounce",
          restitution: 1,
          friction: 0,
          roll: { radius: 0.5, resistance },
        });
      if (
        continued.kind !== "roll" ||
        !vclose(continued.velocity, { x: 3, y: 0, z: 0 }, 0) ||
        !nclose(continued.deceleration, resistance * 8, 0)
      )
        failures.push(`roll with resistance ${resistance}`);
    } catch (error) {
      failures.push(`valid roll options: ${String(error)}`);
    }
  }

  TestValidator.predicate(
    `bounce roll option admission: ${failures.join("; ")}`,
    failures.length === 0,
  );
}
