import { validateModel } from "@automovie/engine";
import { IAutoMovieBody } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

const withBody: (body: IAutoMovieBody) => ReturnType<typeof validateModel> = (
  body: IAutoMovieBody,
): ReturnType<typeof validateModel> =>
  validateModel({ model: { ...createModel(), body } });

/**
 * Model admission checks a body's optional frictions: each inside the unit interval, the kinetic one only with a static one and no greater than it.
 *
 * Scenarios:
 *
 * 1. A body without kinetic friction, and one whose kinetic friction equals or is below its static friction, are admitted.
 * 2. Kinetic friction above the static friction is a range violation on body.kineticFriction.
 * 3. Kinetic friction below 0 is a range violation on body.kineticFriction.
 * 4. A body with neither friction, nothing having measured its rest, is admitted.
 * 5. Kinetic friction without a static friction is a type violation on body.friction.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual model validation with each body and reads its violations, so an unchecked kinetic coefficient, one allowed to resist sliding more than sticking, an unmeasured rest refused, or a kinetic coefficient left without the static one it is bounded by is caught.
 * @evidence contracts/development/testing.md#independent-expectations A sliding contact never resists more than a sticking one, the order every measured pair keeps (static at least kinetic), and coefficients lie in the unit interval the body's other coefficients use.
 * @evidence contracts/development/testing.md#distinguishing-cases Absent, below, equal, above and negative kinetic friction, and absent static friction with and without a kinetic one.
 * @evidence contracts/development/testing.md#execution-ownership The named synchronous unit owns calls through a private helper and the existing model fixture; no physics host participates.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_validation_model_body_kinetic_friction(): void {
  const body = (
    kineticFriction?: number,
    friction: number | null = 0.6,
  ): IAutoMovieBody => ({
    mass: 1,
    centerOfMass: null,
    ...(friction === null ? {} : { friction }),
    ...(kineticFriction === undefined ? {} : { kineticFriction }),
    restitution: 0.2,
  });
  for (const kinetic of [undefined, 0.3, 0.6])
    TestValidator.equals(
      `kinetic friction ${kinetic} is admitted`,
      withBody(body(kinetic)).success,
      true,
    );
  TestValidator.predicate(
    "kinetic friction above the static is refused",
    hasViolation(withBody(body(0.7)), "range", ".body.kineticFriction"),
  );
  TestValidator.predicate(
    "negative kinetic friction is refused",
    hasViolation(withBody(body(-0.1)), "range", ".body.kineticFriction"),
  );
  TestValidator.equals(
    "a body with neither friction is admitted",
    withBody(body(undefined, null)).success,
    true,
  );
  TestValidator.predicate(
    "kinetic friction without a static one is refused",
    hasViolation(withBody(body(0.3, null)), "type", ".body.friction"),
  );
}
