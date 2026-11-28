import {
  CarSteering
} from "../../../../../packages/archetypes/src/vehicles/internal/CarSteering";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Allows trigonometric arithmetic and division by the measured turn. */
const STEERING_ROUNDING: number = 64 * Number.EPSILON;

/**
 * The rear axle sets the steering angle even for an exceptionally gentle turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names signed turn, neutral steering and exceptionally gentle finite curvature cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual steering routine for both turn signs, zero and a curvature whose squared radius exceeds binary64. Compares the resolved steering ratio and small-angle scale.
 * @evidence contracts/development/testing.md#independent-expectations The authored right triangle gives rear-axle radius four from centre radius `sqrt(20)` and half wheelbase two. A wheelbase equal to the rear radius gives a 45 degree road-wheel turn.
 */
export function test_archetypes_vehicles_car_steering(): void {
  const wheelbase: number = 4;
  const ratio: number = 12;
  // The rear axle runs on radius 4 when the centre runs on radius sqrt(4²+2²).
  const curvature: number = 1 / Math.sqrt(20);
  for (const sign of [-1, 1])
    TestValidator.predicate(
      "the road wheels turn 45 degrees in the bend's direction",
      nclose(
        CarSteering(wheelbase, ratio, sign * curvature) / ratio,
        sign * 45,
        45 * STEERING_ROUNDING,
      ),
    );
  TestValidator.equals(
    "a straight path keeps the wheel neutral",
    CarSteering(wheelbase, ratio, 0),
    0,
  );

  const gentle: number = 2 ** -550;
  // At this scale the cubic correction to tan(angle) is below a binary64 ULP.
  const expected: number = (wheelbase * gentle * ratio * 180) / Math.PI;
  TestValidator.predicate(
    "a turn survives when the square of its radius does not fit in binary64",
    nclose(
      CarSteering(wheelbase, ratio, gentle) / expected,
      1,
      STEERING_ROUNDING,
    ),
  );
}
