import { validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";

/**
 * Admit omitted or valid numerical body metadata without claiming a simulated physical body.
 *
 * Scenarios:
 *
 * 1. The default model (body: null) succeeds.
 * 2. A fully-specified valid body with an explicit center of mass succeeds.
 * 3. A valid body may leave centerOfMass null and use coefficient endpoints zero and one.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual model validation for null body, finite explicit center and null center with endpoint coefficients, requiring success so body metadata remains opt-in and valid boundaries are not refused.
 * @evidence contracts/testing.md#independent-expectations Positive masses, finite supplied center coordinates and inclusive [0,1] coefficients meet the declared scalar contract; null center means unspecified metadata rather than proof that derivation occurred.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts null/present body, explicit/omitted center and interior/endpoint coefficients; invalid masses, coefficients and center coordinates have a separate entry.
 * @evidence contracts/testing.md#execution-ownership The named portable entry owns three existing-fixture model records and reads actual engine admission, with no physics host, renderer or native artifact.
 */
export function test_validation_model_body_valid(): void {
  TestValidator.equals(
    "null body succeeds",
    validateModel({ model: createModel() }).success,
    true,
  );
  TestValidator.equals(
    "valid body with explicit COM succeeds",
    validateModel({
      model: {
        ...createModel(),
        body: {
          mass: 2.5,
          centerOfMass: { x: 0, y: 0.3, z: 0 },
          friction: 0.6,
          restitution: 0.2,
        },
      },
    }).success,
    true,
  );
  TestValidator.equals(
    "valid body with null COM and boundary coefficients succeeds",
    validateModel({
      model: {
        ...createModel(),
        body: { mass: 1, centerOfMass: null, friction: 0, restitution: 1 },
      },
    }).success,
    true,
  );
}
