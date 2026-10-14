import { IAutoMovieBodyCollisionResult, IAutoMovieCollisionActor, detectBodyCollision } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { staticActor } from "../internal/collision";
import { hasViolation } from "../internal/predicates";

const apart: () => { a: IAutoMovieCollisionActor; b: IAutoMovieCollisionActor } = (): { a: IAutoMovieCollisionActor; b: IAutoMovieCollisionActor } => ({
  a: staticActor({
    node: "A",
    a: { x: 0, y: 0, z: 0 },
    b: { x: 1, y: 0, z: 0 },
    radius: 0.2,
  }),
  b: staticActor({
    node: "B",
    a: { x: 0, y: 5, z: 0 },
    b: { x: 1, y: 5, z: 0 },
    radius: 0.2,
  }),
});

/**
 * Unlike an overlap (advisory), a malformed sampleRate is an integrity error:
 * the check cannot run, so it fails with an `error`-severity range violation:
 * the config axis stays hard even though the physics axis is soft.
 *
 * Scenarios:
 *
 * 1. A non-finite sampleRate fails with a range violation on sampleRate.
 * 2. A non-positive sampleRate fails the same way.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes detectBodyCollision with NaN and zero sample rates and checks failed validation with a range finding at sampleRate, catching accidental defaulting or advisory-only treatment of unusable sampling configuration.
 * @evidence contracts/testing.md#independent-expectations A sampling frequency must be finite and strictly positive; NaN and zero violate separate parts of that domain. The distant valid capsules isolate rate admission from overlap advice, while assertions do not inspect empty events or prove that sampling was skipped.
 * @evidence contracts/testing.md#distinguishing-cases Non-finite and zero rates distinguish two refusals. Positive rates are exercised by the ordinary collision test; negative finite rates, infinity, and malformed capsule precedence are outside this case.
 * @evidence contracts/testing.md#execution-ownership The named test_validation_body_collision_bad_rate entry reaches portable detector admission with shared staticActor fixtures, with no real host or dynamically registered cases.
 */
export function test_validation_body_collision_bad_rate(): void {
  const nan: IAutoMovieBodyCollisionResult = detectBodyCollision({ ...apart(), sampleRate: Number.NaN });
  TestValidator.equals("non-finite rate fails", nan.validation.success, false);
  TestValidator.predicate(
    "range violation on sampleRate (non-finite)",
    hasViolation(nan.validation, "range", ".sampleRate"),
  );

  const zero: IAutoMovieBodyCollisionResult = detectBodyCollision({ ...apart(), sampleRate: 0 });
  TestValidator.equals(
    "non-positive rate fails",
    zero.validation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on sampleRate (non-positive)",
    hasViolation(zero.validation, "range", ".sampleRate"),
  );
}
