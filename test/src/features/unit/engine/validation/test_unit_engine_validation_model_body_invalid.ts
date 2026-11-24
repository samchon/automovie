import { validateModel } from "@automovie/engine";
import { IAutoMovieBody } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

const withBody: (body: IAutoMovieBody) => ReturnType<typeof validateModel> = (
  body: IAutoMovieBody,
): ReturnType<typeof validateModel> =>
  validateModel({ model: { ...createModel(), body } });

/**
 * Model admission checks body mass, unit-interval coefficients and explicit
 * center-of-mass coordinates at their owning range paths.
 *
 * Scenarios:
 *
 * 1. Mass = 0 (non-positive) is a range violation on body.mass.
 * 2. Mass = Infinity (non-finite) is a range violation on body.mass.
 * 3. Friction = 2 (above 1) is a range violation on body.friction.
 * 4. Restitution = -0.1 (below 0) is a range violation on body.restitution.
 * 5. A non-finite center-of-mass axis is a range violation on that axis.
 */
export function test_unit_engine_validation_model_body_invalid(): void {
  const zeroMass: ReturnType<typeof validateModel> = withBody({
    mass: 0,
    centerOfMass: null,
    friction: 0.5,
    restitution: 0.5,
  });
  TestValidator.equals("zero mass fails", zeroMass.success, false);
  TestValidator.predicate(
    "range violation on body.mass (non-positive)",
    hasViolation(zeroMass, "range", ".body.mass"),
  );

  TestValidator.predicate(
    "range violation on body.friction",
    hasViolation(
      withBody({ mass: 1, centerOfMass: null, friction: 2, restitution: 0.5 }),
      "range",
      ".body.friction",
    ),
  );

  TestValidator.predicate(
    "range violation on body.restitution",
    hasViolation(
      withBody({
        mass: 1,
        centerOfMass: null,
        friction: 0.5,
        restitution: -0.1,
      }),
      "range",
      ".body.restitution",
    ),
  );
}
