import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { embraceFromBehindSolve } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few sums, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `embraceFromBehindSolve.neck` adds a solved embrace's neck by a share: its
 * flexion, side bend and turn each shared between the neck and the head over
 * what they hold, and its protraction flexing the neck and extending the head
 * by as much; `degrees` turns radians into degrees.
 *
 * Scenarios, a solution of 12 degrees' flexion, 8 of side bend, 20 of turn and
 * 6 of protraction on a neck holding 3 degrees of flexion:
 *
 * 1. At share 0 the joints keep what they held.
 * 2. At share 0.5 the neck and head together add 6 of flexion (the protraction
 *    cancelling between them), 4 of side bend and 10 of turn, and the neck
 *    alone flexes 3 more than its share by the protraction.
 * 3. Pi radians are 180 degrees.
 */
export function test_motions_touch_embrace_from_behind_neck(): void {
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0.9, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { neck: [3, 0, 0] },
    limbs: {},
  };
  const solved: embraceFromBehindSolve.ISolved = {
    advance: 0,
    shift: 0,
    pitch: 0,
    roll: 0,
    sink: 0,
    raise: 0,
    twist: 20,
    flexion: 12,
    tilt: 8,
    protract: 6,
    miss: 0,
  };
  const none: IAutoMovieMotionHumanPosture = embraceFromBehindSolve.neck(
    posture,
    solved,
    0,
  );
  TestValidator.predicate(
    "no share",
    nclose(none.joints.neck![0], 3, ROUNDING) &&
      nclose(none.joints.head![0], 0, ROUNDING) &&
      nclose(none.joints.head![2], 0, ROUNDING),
  );
  const half: IAutoMovieMotionHumanPosture = embraceFromBehindSolve.neck(
    posture,
    solved,
    0.5,
  );
  const bare: IAutoMovieMotionHumanPosture = embraceFromBehindSolve.neck(
    posture,
    { ...solved, protract: 0 },
    0.5,
  );
  TestValidator.predicate(
    "half the neck",
    nclose(half.joints.neck![0] + half.joints.head![0], 3 + 6, ROUNDING) &&
      nclose(half.joints.neck![1] + half.joints.head![1], 4, ROUNDING) &&
      nclose(half.joints.neck![2] + half.joints.head![2], 10, ROUNDING) &&
      nclose(half.joints.neck![0] - bare.joints.neck![0], 3, ROUNDING),
  );
  TestValidator.predicate(
    "degrees",
    nclose(embraceFromBehindSolve.degrees(Math.PI), 180, ROUNDING),
  );
}
