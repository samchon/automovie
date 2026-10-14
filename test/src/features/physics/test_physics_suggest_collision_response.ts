import {
  IAutoMovieImpactBody,
  suggestCollisionResponse,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/fixtures";
import { nclose, vclose } from "../internal/predicates";

const bodyAt: (mass: number, vx: number) => IAutoMovieImpactBody = (
  mass: number,
  vx: number,
): IAutoMovieImpactBody => ({
  mass,
  velocity: { x: vx, y: 0, z: 0 },
  restitution: 0,
  hardness: 0.5,
  penetrability: 0,
});

/**
 * `suggestCollisionResponse` composes the resolved impact, the recoil push its
 * impulse maps to, and (when a struck chain is given) the ROM-bounded flinch.
 * Two equal 2kg bodies, one closing at 1 m/s along the normal, give a textbook
 * normal impulse; the flinch appears only when a chain is supplied.
 *
 * Scenarios:
 *
 * 1. The impulse is (1,0,0) (jn = closing / (1/mₐ + 1/m_b) = 1) and speed 1.
 * 2. Push.flexion = |impulse| * gain = 10 at gain 10.
 * 3. With a chain + skeleton, the flinch pose deflects the struck bone by 10°.
 * 4. Without a chain, the recoil pose is null.
 *
 * @evidence contracts/testing.md#behavioral-verification Composes collision, impulse-to-push and optional recoil, asserting impulse, speed, gain, struck bone and pose omission, catching a lost bridge or unconditional flinch generation.
 * @evidence contracts/testing.md#independent-expectations Equal 2 kg bodies closing at 1 m/s give impulse 1 by momentum balance, gain 10 gives flexion 10 and the supplied head chain defines bone identity. This fixture does not independently prove every helper or rendered directional response.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts a supplied chain plus skeleton with neither supplied while preserving identical body/gain inputs; detailed mechanics, invalid inputs and ROM bounds belong to neighboring helper units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit invokes the composer with the existing skeletal fixture and owns its assertions without hosts, rendered assets or dynamically registered cases.
 */
export function test_physics_suggest_collision_response(): void {
  const withChain: ReturnType<typeof suggestCollisionResponse> =
    suggestCollisionResponse({
      a: bodyAt(2, 0),
      b: bodyAt(2, -1),
      normal: { x: 1, y: 0, z: 0 },
      gainDegPerImpulse: 10,
      chain: ["head"],
      skeleton: createSkeleton(),
    });
  TestValidator.predicate(
    "textbook normal impulse",
    vclose(withChain.impact.impulse, { x: 1, y: 0, z: 0 }),
  );
  TestValidator.predicate("closing speed 1", nclose(withChain.impact.speed, 1));
  TestValidator.predicate(
    "push flexion = |impulse| * gain",
    nclose(withChain.push.flexion ?? Number.NaN, 10),
  );
  TestValidator.equals(
    "flinch on the struck bone",
    withChain.recoil?.joints[0]?.bone ?? null,
    "head",
  );
  TestValidator.predicate(
    "flinch deflects 10 degrees",
    nclose(withChain.recoil?.joints[0]?.flexion ?? Number.NaN, 10),
  );

  const noChain: ReturnType<typeof suggestCollisionResponse> =
    suggestCollisionResponse({
      a: bodyAt(2, 0),
      b: bodyAt(2, -1),
      normal: { x: 1, y: 0, z: 0 },
      gainDegPerImpulse: 10,
    });
  TestValidator.equals("no chain → no flinch", noChain.recoil, null);
}
