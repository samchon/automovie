import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * `GymnasticsFlight.turned` turns a posture with no roll rigidly about a world
 * point: its heading gains `yaw`, its tip gains `pitch`, and its root and its
 * world limb goals go round the pivot; a goal on a bone is kept.
 *
 * A posture rooted 1 m up at the origin, with a world hand goal at (1, 1, 0)
 * and a foot goal on the hips.
 *
 * Scenarios:
 *
 * 1. A quarter turn about the origin keeps the root on the axis, heads 90 degrees
 *    and carries the hand goal from +X to -Z, its bend hint with it.
 * 2. The goal on a bone is kept as it was.
 * 3. A posture with a roll is refused.
 */
export function test_unit_motions_sport_gymnastics_flight_turned(): void {
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 1, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {
      leftArm: { point: { x: 1, y: 1, z: 0 }, bend: { x: 1, y: 1.2, z: 0 } },
      leftLeg: {
        point: { x: 0, y: 0, z: 0 },
        bend: { x: 0, y: 0.5, z: 0.1 },
        on: "hips",
      },
    },
  };
  const turned: IAutoMovieMotionHumanPosture = GymnasticsFlight.turned(
    posture,
    { x: 0, y: 0, z: 0 },
    90,
    0,
  );
  TestValidator.predicate(
    "the root, heading and world goal",
    vclose(turned.root, { x: 0, y: 1, z: 0 }, 1e-12) &&
      turned.yaw === 90 &&
      turned.pitch === 0 &&
      vclose(turned.limbs.leftArm!.point, { x: 0, y: 1, z: -1 }, 1e-12) &&
      vclose(turned.limbs.leftArm!.bend, { x: 0, y: 1.2, z: -1 }, 1e-12),
  );
  TestValidator.equals(
    "the goal on a bone",
    turned.limbs.leftLeg,
    posture.limbs.leftLeg,
  );
  TestValidator.predicate(
    "a roll refused",
    throwsError(() =>
      GymnasticsFlight.turned(
        { ...posture, roll: 5 },
        { x: 0, y: 0, z: 0 },
        90,
        0,
      ),
    ),
  );
}
