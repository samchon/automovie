import { AutoMovieGravity } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanAcrobatics } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../features/internal/nclose";

/**
 * A gymnast rises and returns to the launch height under constant gravity.
 *
 * Scenarios:
 * 1. Choosing the launch speed for one second of ascent fixes the apex and the two-second landing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the free-flight centre at apex and landing. Reads the declared fall duration or the absence of a solution.
 * @evidence contracts/development/testing.md#independent-expectations Average ascent speed is half of launch speed. Horizontal speed is constant. Symmetry about the one-second apex gives the late crossing at 1.5 seconds.
 * @evidence contracts/development/testing.md#distinguishing-cases Ascent and descent share horizontal motion but differ in vertical displacement. A reachable raised floor has two roots and an unreachable one has none.
 * @evidence contracts/development/testing.md#execution-ownership Calls the gymnastics centre law directly. Direct scalar calls start no performance.
 * @evidence contracts/development/common.md#meaningful-documentation States the launch and observed instants. Describes the two physical outcomes.
 */
export function test_motion_jump_window(): void {
  descendingCrossing();
  const from: IAutoMovieVector3 = { x: 1, y: 2, z: -3 };
  const velocity: IAutoMovieVector3 = {
    x: -2,
    y: AutoMovieGravity.STANDARD,
    z: 3,
  };
  const apex: IAutoMovieVector3 =
    AutoMovieMotionHumanAcrobatics.GymnasticsFlight.at(from, velocity, 1);
  const landing: IAutoMovieVector3 =
    AutoMovieMotionHumanAcrobatics.GymnasticsFlight.at(from, velocity, 2);
  for (let index = 0; index <= 20; index++) {
    const t: number = index / 10;
    const point: IAutoMovieVector3 =
      AutoMovieMotionHumanAcrobatics.GymnasticsFlight.at(from, velocity, t);
    const belowApex: number = (AutoMovieGravity.STANDARD / 2) * (t - 1) ** 2;
    TestValidator.predicate(
      `free-flight position in metres at ${t}s`,
      nclose(point.x, 1 - 2 * t) &&
        nclose(point.y, 2 + AutoMovieGravity.STANDARD / 2 - belowApex) &&
        nclose(point.z, -3 + 3 * t),
    );
  }
  TestValidator.predicate(
    "apex",
    nclose(apex.x, -1) &&
      nclose(apex.y, 2 + velocity.y / 2) &&
      nclose(apex.z, 0),
  );
  TestValidator.predicate(
    "landing",
    nclose(landing.x, -3) && nclose(landing.y, 2) && nclose(landing.z, 3),
  );
}
/**
 * A descending gymnast reaches a raised landing surface on the later crossing.
 *
 * Scenarios:
 * 1. A surface three quarters of the apex height is crossed at half and one-and-a-half ascent times.
 * 2. A surface above the apex has no crossing.
 *
 */
function descendingCrossing(): void {
  const speed: number = AutoMovieGravity.STANDARD;
  const descent: number | null =
    AutoMovieMotionHumanAcrobatics.GymnasticsFlight.fall(
      0,
      speed,
      (3 * speed) / 8,
    );
  TestValidator.predicate(
    "descending crossing",
    descent !== null && nclose(descent, 1.5),
  );
  TestValidator.equals(
    "above apex",
    AutoMovieMotionHumanAcrobatics.GymnasticsFlight.fall(0, speed, speed),
    null,
  );
}
