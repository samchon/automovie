import { AutoMovieEngineGravity } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanAcrobatics } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Check ballistic positions, landing and the descending crossing of a raised
 * surface.
 *
 * Scenarios:
 *
 * 1. With one second of ascent, sample 21 points through flight, including
 *    apex at 1 s and return to launch height at 2 s.
 * 2. A raised surface at three quarters of apex height gives the descending
 *    crossing at 1.5 s. A surface above the apex gives no crossing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases distinguish equality of launch and landing heights from a chosen descent root.
 * @evidence contracts/development/testing.md#behavioral-verification Public flight functions are called with fixed three-axis velocity and two raised surfaces.
 * @evidence contracts/development/testing.md#independent-expectations Horizontal position is linear. The height curve around its known apex is `g * (t - 1) ** 2 / 2` below the apex.
 */
export function test_motions_next_acrobatics_window(): void {
  descendingCrossing();
  const from: IAutoMovieVector3 = { x: 1, y: 2, z: -3 };
  const velocity: IAutoMovieVector3 = {
    x: -2,
    y: AutoMovieEngineGravity.STANDARD,
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
    const belowApex: number = (AutoMovieEngineGravity.STANDARD / 2) * (t - 1) ** 2;
    TestValidator.predicate(
      `free-flight position in metres at ${t}s`,
      nclose(point.x, 1 - 2 * t) &&
        nclose(point.y, 2 + AutoMovieEngineGravity.STANDARD / 2 - belowApex) &&
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
 *
 * 1. A surface three quarters of the apex height is crossed at half and
 *    one-and-a-half ascent times.
 * 2. A surface above the apex has no crossing.
 */
function descendingCrossing(): void {
  const speed: number = AutoMovieEngineGravity.STANDARD;
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
