import { resolveImpact } from "@automovie/engine";
import type {
  IAutoMovieImpactBodyState,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `resolveImpact` resolves the impulse between two bodies along a contact
 * normal.
 *
 * Body: mass 1, at rest, restitution 0.2, hardness 0.5, penetrability 0.1. Body
 * A moves at 10 along +Z towards B, normal (0, 0, 1).
 *
 * Scenarios:
 *
 * 1. The closing speed is 10, the impulse along z is 5 and both bodies leave at z
 *    = 5 (the inelastic share of equal masses).
 * 2. A mass of 0 or -1 on either body is refused.
 * 3. A zero contact normal is refused.
 * 4. A restitution, hardness or penetrability of -0.1 or 1.1 on either body is
 *    refused.
 */
export function test_unit_engine_physics_resolve_impact(): void {
  const v = (x: number, y: number, z: number): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const rest: IAutoMovieImpactBodyState = {
    mass: 1,
    velocity: v(0, 0, 0),
    restitution: 0.2,
    hardness: 0.5,
    penetrability: 0.1,
  };
  const moving: IAutoMovieImpactBodyState = { ...rest, velocity: v(0, 0, 10) };
  const normal: IAutoMovieVector3 = v(0, 0, 1);

  const impact = resolveImpact(moving, rest, normal);
  TestValidator.equals("closing speed", impact.speed, 10);
  TestValidator.equals("impulse", impact.impulse.z, 5);
  TestValidator.equals("velocity A", impact.velocityA.z, 5);
  TestValidator.equals("velocity B", impact.velocityB.z, 5);

  for (const mass of [0, -1]) {
    TestValidator.predicate(
      `mass A ${mass}`,
      throwsError(() => resolveImpact({ ...moving, mass }, rest, normal)),
    );
    TestValidator.predicate(
      `mass B ${mass}`,
      throwsError(() => resolveImpact(moving, { ...rest, mass }, normal)),
    );
  }
  TestValidator.predicate(
    "zero normal",
    throwsError(() => resolveImpact(moving, rest, v(0, 0, 0))),
  );
  const coefficients: ("restitution" | "hardness" | "penetrability")[] = [
    "restitution",
    "hardness",
    "penetrability",
  ];
  for (const field of coefficients)
    for (const value of [-0.1, 1.1]) {
      TestValidator.predicate(
        `A ${field} ${value}`,
        throwsError(() =>
          resolveImpact({ ...moving, [field]: value }, rest, normal),
        ),
      );
      TestValidator.predicate(
        `B ${field} ${value}`,
        throwsError(() =>
          resolveImpact(moving, { ...rest, [field]: value }, normal),
        ),
      );
    }
}
