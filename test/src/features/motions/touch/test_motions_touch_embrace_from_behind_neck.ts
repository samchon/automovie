import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import {
  embraceFromBehindSolve
} from "../../../../../packages/motions/src/touch/internal/embraceFromBehindSolve";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few sums, degrees. */
const ROUNDING: number = 1e-12;

/**
 * Check how a solved neck movement is applied across the neck and head.
 *
 * Scenarios:
 *
 * 1. At zero share keep the existing 3-degree neck flexion and zero head
 *    angles.
 * 2. At half share add 6 degrees flexion, 4 side bend and 10 yaw jointly.
 *    Protraction adds another 3 degrees to the neck while cancelling across
 *    both joints.
 * 3. Convert pi radians to 180 degrees.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the existing pose, applied fraction and angular units.
 * @evidence contracts/development/testing.md#behavioral-verification The test reads both affected joints and compares a matching half-share control with no protraction.
 * @evidence contracts/development/testing.md#independent-expectations The expected changes are halves of the input angles, with equal and opposite protraction at the two joints.
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
