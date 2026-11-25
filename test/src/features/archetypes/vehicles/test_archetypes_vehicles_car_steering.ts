import { CarSteering } from "@automovie/archetypes/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Allows trigonometric arithmetic and division by the measured turn. */
const STEERING_ROUNDING: number = 64 * Number.EPSILON;

/** The rear axle sets the steering angle even for an exceptionally gentle turn. */
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
