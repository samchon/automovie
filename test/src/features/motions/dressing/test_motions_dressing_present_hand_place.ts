import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  presentHandPlace
} from "../../../../../packages/motions/src/dressing/internal/presentHandPlace";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Rounding of a few sums and a half turn, metres. */
const ROUNDING: number = 1e-12;

/**
 * Check the palm point for a presented hand.
 *
 * Scenarios:
 *
 * 1. With a 0.2 m shoulder half width and a 1.45 m shoulder height, the left
 *    palm faces +Z at (0.06, 1.15, 0.365) m.
 * 2. The right palm mirrors X. Facing -Z also reverses the left palm's
 *    forward direction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the palm point and both side and yaw changes.
 * @evidence contracts/development/testing.md#behavioral-verification The placement reader takes fixed body measurements and evaluates both hands and the turned entry.
 * @evidence contracts/development/testing.md#independent-expectations The coordinates are 0.3 times shoulder half width, shoulder height minus upper arm length, and forearm plus half a hand ahead.
 */
export function test_motions_dressing_present_hand_place(): void {
  const measure: presentHandPlace.IMeasure = {
    shoulderHalfWidth: 0.2,
    shoulderHeight: 1.45,
    upperArm: 0.3,
    forearm: 0.27,
    hand: 0.19,
  };
  const root: IAutoMovieVector3 = { x: 0, y: 0.95, z: 0 };
  TestValidator.predicate(
    "the left palm",
    vclose(
      presentHandPlace(measure, "left", { origin: root, yaw: 0 }),
      { x: 0.06, y: 1.15, z: 0.365 },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "the right palm",
    vclose(
      presentHandPlace(measure, "right", { origin: root, yaw: 0 }),
      { x: -0.06, y: 1.15, z: 0.365 },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "turned about",
    vclose(
      presentHandPlace(measure, "left", { origin: root, yaw: 180 }),
      { x: -0.06, y: 1.15, z: -0.365 },
      ROUNDING,
    ),
  );
}
