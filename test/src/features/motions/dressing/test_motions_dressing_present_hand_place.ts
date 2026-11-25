import type { IAutoMovieVector3 } from "@automovie/interface";
import { presentHandPlace } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Rounding of a few sums and a half turn, metres. */
const ROUNDING: number = 1e-12;

/**
 * `presentHandPlace` puts a presented palm where the arm reaches with the upper
 * arm hanging and the forearm level ahead: 0.3 of the shoulder's half width out
 * from the midline, the upper arm's length below the shoulder, and the forearm
 * and half the hand ahead.
 *
 * Scenarios, for a 0.2 m shoulder half width, 1.45 m shoulder height, 0.3 m
 * upper arm, 0.27 m forearm and 0.19 m hand, the root at (0, 0.95, 0):
 *
 * 1. Facing +Z, the left palm is at (0.06, 1.15, 0.365).
 * 2. The right palm mirrors it across the midline, (-0.06, 1.15, 0.365).
 * 3. Facing -Z (yaw 180) the left palm turns with the body, (-0.06, 1.15, -0.365).
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
