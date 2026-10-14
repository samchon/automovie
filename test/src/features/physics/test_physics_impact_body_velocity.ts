import { IAutoMovieImpactBody, resolveImpact } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (
  x: number,
  y: number,
  z: number,
): IAutoMovieVector3 => ({ x, y, z });

const BODY: IAutoMovieImpactBody = {
  mass: 1,
  velocity: v(0, 0, 0),
  restitution: 0.2,
  hardness: 0.5,
  penetrability: 0.1,
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
 * Impact velocity vectors feed the relative-velocity dot product, closing
 * speed, impulse, and post-impact velocities. A non-finite body velocity must
 * fail before that response math can emit non-finite impact results.
 *
 * Scenarios:
 *
 * 1. Non-finite velocity components on either body throw before impact math.
 * 2. Finite body velocities keep the existing inelastic impulse behavior.
 *
 * @evidence contracts/testing.md#behavioral-verification Rejects invalid velocity components on each body, then checks finite closing speed, impulse and both outgoing speeds, catching either non-finite admission or a guard that refuses valid collisions.
 * @evidence contracts/testing.md#independent-expectations Finite velocity is the admission contract; equal unit masses at closing speed 10 with an inelastic response give impulse 5 and shared speed 5 by momentum balance. Exception presence, not identity, is asserted and extreme-finite overflow is outside this fixture.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts NaN on body a, infinity on body b and a finite positive twin; mass/material/normal admission and other response kinds belong to neighboring impact units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit calls resolveImpact on authored records and owns every assertion without real hosts or dynamically registered cases.
 */
export function test_physics_impact_body_velocity(): void {
  const moving: IAutoMovieImpactBody = { ...BODY, velocity: v(0, 0, 10) };
  const normal: IAutoMovieVector3 = v(0, 0, 1);

  TestValidator.predicate(
    "body a non-finite velocity throws",
    throws(
      (): ReturnType<typeof resolveImpact> =>
        resolveImpact(
          { ...moving, velocity: v(Number.NaN, 0, 10) },
          BODY,
          normal,
        ),
    ),
  );
  TestValidator.predicate(
    "body b non-finite velocity throws",
    throws(
      (): ReturnType<typeof resolveImpact> =>
        resolveImpact(moving, { ...BODY, velocity: v(0, Infinity, 0) }, normal),
    ),
  );

  const impact: ReturnType<typeof resolveImpact> = resolveImpact(
    moving,
    BODY,
    normal,
  );
  TestValidator.predicate(
    "finite closing speed remains 10",
    nclose(impact.speed, 10),
  );
  TestValidator.predicate(
    "finite impulse remains 5",
    nclose(impact.impulse.z, 5),
  );
  TestValidator.predicate(
    "finite post-impact velocities remain inelastic",
    nclose(impact.velocityA.z, 5) && nclose(impact.velocityB.z, 5),
  );
}
