import { AutoMovieEnginePhysics } from "@automovie/engine";
import type { IAutoMovieImpactBodyState } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../internal/fixtures";

/**
 * `suggestCollisionResponse` composes the resolved impact, the recoil push its
 * impulse maps to, and, when a struck chain is given, the bounded flinch.
 *
 * Bodies: two 2 kg bodies, A at rest and B closing at -1 m/s along the normal
 * (1, 0, 0), restitution 0, hardness 0.5; gain 10 degrees per impulse.
 *
 * Scenarios:
 *
 * 1. The normal impulse is (1, 0, 0), since jn = closing / (1/2 + 1/2) = 1, and
 *    the closing speed is 1.
 * 2. The push flexion is |impulse| x gain = 10.
 * 3. With the chain `head`, the flinch deflects `head` by 10 degrees.
 * 4. Without a chain the recoil is null.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines collision response composition through normal impulse, converted recoil and optional bounded bone flinch.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the response on two equal bodies with and without a struck head chain under the same material and gain.
 * @evidence contracts/development/testing.md#independent-expectations Closing speed 1 divided by combined inverse mass 1 gives impulse (1, 0, 0). Gain 10 gives a 10-degree push and head flinch, and no chain yields null recoil.
 */
export function test_engine_physics_suggest_collision_response(): void {
  const bodyAt = (mass: number, vx: number): IAutoMovieImpactBodyState => ({
    mass,
    velocity: { x: vx, y: 0, z: 0 },
    restitution: 0,
    hardness: 0.5,
    penetrability: 0,
  });
  const withChain = AutoMovieEnginePhysics.suggestCollisionResponse({
    a: bodyAt(2, 0),
    b: bodyAt(2, -1),
    normal: { x: 1, y: 0, z: 0 },
    gainDegPerImpulse: 10,
    chain: ["head"],
    skeleton: createSkeleton(),
  });
  TestValidator.equals("impulse", withChain.impact.impulse, {
    x: 1,
    y: 0,
    z: 0,
  });
  TestValidator.equals("speed", withChain.impact.speed, 1);
  TestValidator.equals("push", withChain.push.flexion, 10);
  TestValidator.equals(
    "flinch bone",
    withChain.recoil?.joints[0]?.bone,
    "head",
  );
  TestValidator.equals(
    "flinch angle",
    withChain.recoil?.joints[0]?.flexion,
    10,
  );
  const noChain = AutoMovieEnginePhysics.suggestCollisionResponse({
    a: bodyAt(2, 0),
    b: bodyAt(2, -1),
    normal: { x: 1, y: 0, z: 0 },
    gainDegPerImpulse: 10,
  });
  TestValidator.equals("no chain", noChain.recoil, null);
}
