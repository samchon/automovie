import { IAutoMovieBodyCollisionResult, detectBodyCollision } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { staticActor } from "../internal/collision";
import { validationHasNoWarnings } from "../internal/predicates";

/**
 * A `physicsIntent` marker (a choreographed fight, a stylized clash)
 * acknowledges the overlap: the warnings and the suggested response are
 * suppressed so the correction loop does not nag, while the contact events
 * still surface for downstream and render ("one calculation, two consumers").
 *
 * Scenarios:
 *
 * 1. The same overlap that warns without a marker produces no warnings and no
 *    suggested response once `physicsIntent` is set.
 * 2. The contact events are still emitted (they are observational).
 *
 * @evidence contracts/testing.md#behavioral-verification Calls detectBodyCollision with an intentional overlap and asserts clean validation, a null suggested response, and two retained contact events, catching suppression that incorrectly drops observations or retains correction advice.
 * @evidence contracts/testing.md#independent-expectations The capsules' 0.1 m centerline separation is below their summed 0.4 m radii throughout the one-second window; endpoint-inclusive 1 Hz sampling gives two contacts. The documented physicsIntent policy suppresses warnings and response independently of event collection; event content is not asserted here.
 * @evidence contracts/testing.md#distinguishing-cases This case owns the marker-present branch using the same geometry as the unmarked collision test. That neighboring test owns unsuppressed overlap and separation; malformed-input precedence and marker string contents are outside this test.
 * @evidence contracts/testing.md#execution-ownership The named test_validation_body_collision_intent entry uses the portable detector and shared staticActor fixture without a real physics/render host or dynamically registered cases.
 */
export function test_validation_body_collision_intent(): void {
  const result: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: staticActor({
      node: "A",
      a: { x: 0, y: 0, z: 0 },
      b: { x: 1, y: 0, z: 0 },
      radius: 0.2,
      body: { mass: 2, centerOfMass: null, friction: 0.5, restitution: 0 },
    }),
    b: staticActor({
      node: "B",
      a: { x: 0.5, y: 0.1, z: 0 },
      b: { x: 0.5, y: 0.5, z: 0 },
      radius: 0.2,
    }),
    sampleRate: 1,
    physicsIntent: "choreographed",
  });
  TestValidator.predicate(
    "intent suppresses warnings",
    validationHasNoWarnings("intentional body collision", result.validation),
  );
  TestValidator.equals(
    "intent suppresses the suggestion",
    result.response,
    null,
  );
  TestValidator.equals("events still emitted", result.events.length, 2);
}
