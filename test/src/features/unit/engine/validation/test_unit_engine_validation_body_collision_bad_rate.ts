import { detectBodyCollision } from "@automovie/engine";
import type {
  IAutoMovieBodyCollisionResult,
  IAutoMovieCollisionActor,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { staticActor } from "../../../internal/collision";
import { hasViolation } from "../../../internal/predicates";

const apart: () => {
  a: IAutoMovieCollisionActor;
  b: IAutoMovieCollisionActor;
} = (): { a: IAutoMovieCollisionActor; b: IAutoMovieCollisionActor } => ({
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
 */
export function test_unit_engine_validation_body_collision_bad_rate(): void {
  const zero: IAutoMovieBodyCollisionResult = detectBodyCollision({
    ...apart(),
    sampleRate: 0,
  });
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
