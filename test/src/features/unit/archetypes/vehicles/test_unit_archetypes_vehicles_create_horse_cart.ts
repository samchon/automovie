import { createHorseCart } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../internal/archetypeExtent";

/**
 * `createHorseCart` stands its wheels on the floor under their axle.
 *
 * Scenarios, at seed 1038:
 *
 * 1. The left wheel's lowest point is at height 0 and its centre at the `leftSpin`
 *    axle's height, both within 1e-8 m.
 */
export function test_unit_archetypes_vehicles_create_horse_cart(): void {
  const cart: ReturnType<typeof createHorseCart> = createHorseCart(
    { id: "carrier" },
    1038,
  );
  const axle: IAutoMovieVector3 = cart.affordance("leftSpin").frame.translation;
  const wheel: ReturnType<typeof archetypeExtent> = archetypeExtent(cart, "y", [
    "wheel-left",
  ]);
  TestValidator.predicate(
    "the wheel meets the floor under its axle",
    Math.abs(wheel.low) <= 1e-8 &&
      Math.abs((wheel.high + wheel.low) / 2 - axle.y) <= 1e-8,
  );
}
