import {
  cartwheel
} from "../../../../../packages/motions/src/sport/internal/cartwheel";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `cartwheel` law's shape (`cartwheel.shapeShare`): the wheel's shape taken
 * over the first 90 degrees of the turn on a minimum-jerk share, held through
 * the handstand, and let go over the last 90.
 *
 * Scenario: none at 0 and 360 degrees, half at 45 and 315, whole at 90, 180 and
 * 270.
 */
export function test_motions_sport_cartwheel(): void {
  TestValidator.predicate(
    "the shape over the turn",
    cartwheel.SHAPE === 90 &&
      nclose(cartwheel.shapeShare(0), 0, 1e-12) &&
      nclose(cartwheel.shapeShare(45), 0.5, 1e-12) &&
      nclose(cartwheel.shapeShare(90), 1, 1e-12) &&
      nclose(cartwheel.shapeShare(180), 1, 1e-12) &&
      nclose(cartwheel.shapeShare(270), 1, 1e-12) &&
      nclose(cartwheel.shapeShare(315), 0.5, 1e-12) &&
      nclose(cartwheel.shapeShare(360), 0, 1e-12),
  );
}
