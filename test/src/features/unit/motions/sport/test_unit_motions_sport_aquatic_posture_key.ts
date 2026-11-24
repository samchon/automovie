import type {
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { AquaticPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `AquaticPosture.key` poses a key shape from an entry: the key's joints, tip
 * and roll, its yaw added to the entry's heading, at the entry's root or a
 * given one, with no limb goal or rigid turn.
 *
 * Scenarios:
 *
 * 1. An entry heading 30 degrees with a hand goal takes a key yawed 10 and tipped
 *    80: it heads 40, tips 80 and drops the goal.
 * 2. Given a root, the key stands there.
 */
export function test_unit_motions_sport_aquatic_posture_key(): void {
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 1, y: 0, z: 2 },
    yaw: 30,
    pitch: 0,
    roll: 0,
    joints: { neck: [5, 0, 0] },
    limbs: {
      rightArm: { point: { x: 0, y: 1, z: 0 }, bend: { x: 0, y: 1, z: -1 } },
    },
  };
  const target: IAutoMovieMotionHumanExerciseKey.IKey = {
    pitch: 80,
    roll: 5,
    yaw: 10,
    lift: 0,
    joints: { leftLowerLeg: [20, 0, 0] },
  };
  TestValidator.equals(
    "the keyed posture",
    [
      AquaticPosture.key(entry, target),
      AquaticPosture.key(entry, target, { x: 0, y: -1, z: 0 }).root,
    ],
    [
      {
        root: { x: 1, y: 0, z: 2 },
        yaw: 40,
        pitch: 80,
        roll: 5,
        joints: { leftLowerLeg: [20, 0, 0] },
        limbs: {},
        rotation: undefined,
      },
      { x: 0, y: -1, z: 0 },
    ],
  );
}
