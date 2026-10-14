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
 * Model admission checks body mass, unit-interval coefficients and explicit center-of-mass coordinates at their owning range paths.
 *
 * Scenarios:
 *
 * 1. Mass = 0 (non-positive) is a range violation on body.mass.
 * 2. Mass = Infinity (non-finite) is a range violation on body.mass.
 * 3. Friction = 2 (above 1) is a range violation on body.friction.
 * 4. Restitution = -0.1 (below 0) is a range violation on body.restitution.
 * 5. A non-finite center-of-mass axis is a range violation on that axis.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual model validation with one malformed body quantity per input and requires the corresponding range path, catching unvalidated metadata before physics consumers use it.
 * @evidence contracts/testing.md#independent-expectations Mass is finite and strictly positive, friction/restitution lie in inclusive [0,1], and each supplied center coordinate is finite; literal paths locate the invalid quantity without copying a product report.
 * @evidence contracts/testing.md#distinguishing-cases Covers zero/infinite mass, upper friction, lower restitution and NaN center Y; accepted/null bodies and coefficient endpoints have a separate named entry. Other axes and nonfinite coefficients are not exercised here.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns calls through a private helper and existing model fixture; no physics host, geometry builder, renderer or native artifact participates.
 */
export function test_validation_model_body_invalid(): void {
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
    "range violation on body.mass (non-finite)",
    hasViolation(
      withBody({
        mass: Number.POSITIVE_INFINITY,
        centerOfMass: null,
        friction: 0.5,
        restitution: 0.5,
      }),
      "range",
      ".body.mass",
    ),
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

  TestValidator.predicate(
    "range violation on non-finite body.centerOfMass.y",
    hasViolation(
      withBody({
        mass: 1,
        centerOfMass: { x: 0, y: Number.NaN, z: 0 },
        friction: 0.5,
        restitution: 0.5,
      }),
      "range",
      ".body.centerOfMass.y",
    ),
  );
}
