import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `GymnasticsFlight.prepareTurned` prepares rigid turns of one posture about one
 * pivot: each reading adds its yaw and pitch to the posture's own and carries
 * the root round the pivot.
 *
 * A posture rooted at (2, 1, 0) heading 30 degrees, turned about (0, 1, 0).
 *
 * Scenarios:
 *
 * 1. A half turn carries the root to (-2, 1, 0) and heads 210 degrees.
 * 2. No turn keeps the root, and a later reading does not see an earlier one.
 */
export function test_unit_motions_sport_gymnastics_flight_prepare_turned(): void {
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 1, z: 0 },
    yaw: 30,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const turn: (yaw: number, pitch: number) => IAutoMovieMotionHumanPosture =
    GymnasticsFlight.prepareTurned(posture, { x: 0, y: 1, z: 0 });
  const half: IAutoMovieMotionHumanPosture = turn(180, 0);
  const none: IAutoMovieMotionHumanPosture = turn(0, 0);
  TestValidator.predicate(
    "the half turn and none",
    vclose(half.root, { x: -2, y: 1, z: 0 }, 1e-12) &&
      half.yaw === 210 &&
      vclose(none.root, posture.root, 1e-12) &&
      none.yaw === 30,
  );
}
