import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { lieTogetherNeck } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few sums, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `lieTogetherNeck.apply` adds a neck lift to a posture by a weight: the
 * flexion and the side tilt, each shared between the neck and the head, are
 * added to what the two joints hold.
 *
 * Scenarios, a lift of 20 degrees' flexion and 10 of tilt on a neck holding 3
 * degrees of flexion:
 *
 * 1. At weight 0 the joints keep what they held.
 * 2. At weight 0.5 the neck and head together add 10 degrees of flexion and 5
 *    of tilt.
 */
export function test_unit_motions_floor_lie_together_neck(): void {
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0.2, z: 0 },
    yaw: 0,
    pitch: -90,
    roll: 0,
    joints: { neck: [3, 0, 0] },
    limbs: {},
  };
  const lift: lieTogetherNeck.INeck = { flexion: 20, tilt: 10 };
  const none: IAutoMovieMotionHumanPosture = lieTogetherNeck.apply(
    posture,
    lift,
    0,
  );
  TestValidator.predicate(
    "no weight",
    nclose(none.joints.neck![0], 3, ROUNDING) &&
      nclose(none.joints.neck![1], 0, ROUNDING) &&
      nclose(none.joints.head![0], 0, ROUNDING),
  );
  const half: IAutoMovieMotionHumanPosture = lieTogetherNeck.apply(
    posture,
    lift,
    0.5,
  );
  TestValidator.predicate(
    "half the lift",
    nclose(half.joints.neck![0] + half.joints.head![0], 3 + 10, ROUNDING) &&
      nclose(half.joints.neck![1] + half.joints.head![1], 5, ROUNDING),
  );
}
