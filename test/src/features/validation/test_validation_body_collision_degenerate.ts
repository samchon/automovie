import {
  IAutoMovieBodyCollisionResult,
  detectBodyCollision,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { staticActor } from "../internal/collision";
import { validationHasWarnings } from "../internal/predicates";

/**
 * When two capsule centerlines meet at a shared endpoint the closest pair coincides
 * and a contact normal cannot be derived from it, so the check falls back to a
 * default normal rather than crashing `resolveImpact` on a zero vector. The
 * overlap is still reported and a response is still suggested.
 *
 * Scenarios:
 *
 * 1. Actor A's capsule starts where actor B's capsule starts, so the closest points coincide; the check still succeeds with warnings and a non-null response.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs detectBodyCollision on perpendicular capsules sharing an endpoint and asserts warning-only success and a non-null suggested response, catching the zero-normal crash or lost-contact result.
 * @evidence contracts/testing.md#independent-expectations The shared endpoint gives zero centerline distance below summed radii 0.4 m, so contact exists even though its closest-point normal is zero. A response must remain constructible; the assertions do not inspect its chosen normal or numeric components.
 * @evidence contracts/testing.md#distinguishing-cases This case owns the coincident closest-point branch. Ordinary noncoincident overlap, distant capsules, marker suppression, and malformed inputs belong to neighboring detector tests; exact surface tangency is not this centerline coincidence.
 * @evidence contracts/testing.md#execution-ownership The named test_validation_body_collision_degenerate entry uses portable geometry and impact-response arithmetic through shared staticActor fixtures, with no host or dynamically registered cases.
 */
export function test_validation_body_collision_degenerate(): void {
  const result: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: staticActor({
      node: "A",
      a: { x: 0, y: 0, z: 0 },
      b: { x: 1, y: 0, z: 0 },
      radius: 0.2,
    }),
    b: staticActor({
      node: "B",
      a: { x: 0, y: 0, z: 0 },
      b: { x: 0, y: 0, z: 1 },
      radius: 0.2,
    }),
    sampleRate: 1,
  });
  TestValidator.predicate(
    "coincident contact warns",
    validationHasWarnings("coincident body collision", result.validation),
  );
  TestValidator.predicate(
    "response built on the fallback normal",
    result.response !== null,
  );
}
