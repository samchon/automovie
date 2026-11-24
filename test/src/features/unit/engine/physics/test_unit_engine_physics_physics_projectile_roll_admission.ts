import { projectileContinue } from "@automovie/engine";
import type {
  IAutoMovieHit,
  IAutoMovieProjectile,
  IAutoMovieProjectileContinue,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../../../internal/predicates";

/**
 * Bounce roll options are admitted even when the rebound remains a flight.
 *
 * Scenarios:
 * 1. Negative and nonfinite radius or resistance reject under inward, neutral and outward gravity.
 * 2. Omitted options, zero radius and a radius equal to rebound height preserve flight.
 * 3. A larger radius selects rolling, admitting zero resistance and resistance above one.
 */
export function test_unit_engine_physics_physics_projectile_roll_admission(): void {
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
