import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieImpactBodyState,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";
import { throwsError } from "../../internal/predicates";

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
 * 5. Its kinds, from the material heuristic: a hard, bouncy pair (restitution and
 *    hardness 0.9) closing at 10 is a `bounce`, the striker slowing to about
 *    0.95 and the target leaving at about 9.05; a 0.08 kg arrow at 40 into a
 *    soft 75 kg torso (penetrability 0.7) is an `embed`, the arrow stopping
 *    short of 1 and the torso under 0.3; into penetrability 0.9 it goes
 *    `through` above 20, and at 10 it embeds; bodies already separating
 *    `deflect` with no impulse; a slow, soft, non-penetrable scuff at 4
 *    `deflect`s inelastically, both leaving at 2.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes signed closing speed, momentum transfer, material result kinds and refusal for invalid mass, normal or material values.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the impulse resolver on equal bodies, high restitution, an arrow with different target penetrabilities, separating bodies and a slower scuff.
 * @evidence contracts/development/testing.md#independent-expectations Equal masses in an inelastic 10 m/s collision share 5 m/s. Explicit speed ranges distinguish bounce, embed and penetration while separating motion gives zero impulse.
 */
export function test_engine_physics_resolve_impact(): void {
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

  const impact = AutoMovieEnginePhysics.resolveImpact(moving, rest, normal);
  TestValidator.equals("closing speed", impact.speed, 10);
  TestValidator.equals("impulse", impact.impulse.z, 5);
  TestValidator.equals("velocity A", impact.velocityA.z, 5);
  TestValidator.equals("velocity B", impact.velocityB.z, 5);

  for (const mass of [0, -1]) {
    TestValidator.predicate(
      `mass A ${mass}`,
      throwsError(() => AutoMovieEnginePhysics.resolveImpact({ ...moving, mass }, rest, normal)),
    );
    TestValidator.predicate(
      `mass B ${mass}`,
      throwsError(() => AutoMovieEnginePhysics.resolveImpact(moving, { ...rest, mass }, normal)),
    );
  }
  TestValidator.predicate(
    "zero normal",
    throwsError(() => AutoMovieEnginePhysics.resolveImpact(moving, rest, v(0, 0, 0))),
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
          AutoMovieEnginePhysics.resolveImpact({ ...moving, [field]: value }, rest, normal),
        ),
      );
      TestValidator.predicate(
        `B ${field} ${value}`,
        throwsError(() =>
          AutoMovieEnginePhysics.resolveImpact(moving, { ...rest, [field]: value }, normal),
        ),
      );
    }

  // 5. The kinds.
  const near = (a: number, b: number, bound: number): boolean =>
    Math.abs(a - b) <= bound;
  const hard: IAutoMovieImpactBodyState = {
    ...rest,
    restitution: 0.9,
    hardness: 0.9,
  };
  const bounce = AutoMovieEnginePhysics.resolveImpact(
    { ...hard, velocity: v(0, 0, 10) },
    hard,
    normal,
  );
  TestValidator.predicate(
    "a bounce",
    bounce.kind === "bounce" &&
      near(bounce.velocityA.z, 0.95, 0.02) &&
      near(bounce.velocityB.z, 9.05, 0.02),
  );
  const arrow = (speed: number): IAutoMovieImpactBodyState => ({
    ...rest,
    mass: 0.08,
    velocity: v(0, 0, speed),
    hardness: 0.9,
  });
  const torso = (penetrability: number): IAutoMovieImpactBodyState => ({
    ...rest,
    mass: 75,
    restitution: 0.1,
    hardness: 0.2,
    penetrability,
  });
  const embed = AutoMovieEnginePhysics.resolveImpact(arrow(40), torso(0.7), normal);
  TestValidator.predicate(
    "an embed",
    embed.kind === "embed" &&
      embed.velocityA.z >= 0 &&
      embed.velocityA.z < 1 &&
      embed.velocityB.z > 0 &&
      embed.velocityB.z < 0.3,
  );
  const through = AutoMovieEnginePhysics.resolveImpact(arrow(40), torso(0.9), normal);
  TestValidator.predicate(
    "through",
    through.kind === "through" && through.velocityA.z > 20,
  );
  TestValidator.equals(
    "a slower arrow embeds",
    AutoMovieEnginePhysics.resolveImpact(arrow(10), torso(0.9), normal).kind,
    "embed",
  );
  const apart = AutoMovieEnginePhysics.resolveImpact({ ...rest, velocity: v(0, 0, -5) }, rest, normal);
  TestValidator.predicate(
    "separating deflects",
    apart.kind === "deflect" &&
      apart.impulse.z === 0 &&
      apart.velocityA.z === -5,
  );
  const soft: IAutoMovieImpactBodyState = { ...rest, hardness: 0.3 };
  const scuff = AutoMovieEnginePhysics.resolveImpact(
    { ...soft, velocity: v(0, 0, 4) },
    { ...soft, penetrability: 0.2 },
    normal,
  );
  TestValidator.predicate(
    "a scuff deflects inelastically",
    scuff.kind === "deflect" &&
      near(scuff.velocityA.z, 2, PhysicalTolerance.ACCUMULATED) &&
      near(scuff.velocityB.z, 2, PhysicalTolerance.ACCUMULATED),
  );
}
