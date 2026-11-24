import { clampJointRom } from "@automovie/engine";
import type {
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Flexion 10..90 and twist -30..30. */
const RANGE: IAutoMovieJointConstraint = {
  flexion: { min: 10, max: 90 },
  abduction: null,
  twist: { min: -30, max: 30 },
};

/** A pose with the given flexion and twist. */
const pose: (flexion: number, twist: number) => IAutoMovieJointPose = (
  flexion: number,
  twist: number,
): IAutoMovieJointPose => ({
  bone: "leftLowerArm",
  flexion,
  abduction: null,
  twist,
});

/**
 * `clampJointRom` moves each angle to the nearest bound of its interval.
 *
 * Scenarios:
 *
 * 1. A zero below the interval 10..90 moves to 10, and 200 moves to 90.
 * 2. Twist 50 moves to 30 and -50 to -30.
 * 3. Angles inside their intervals are unchanged.
 */
export function test_unit_engine_rom_clamp_joint_rom(): void {
  TestValidator.equals(
    "flexion",
    [
      clampJointRom(pose(0, 0), RANGE).flexion,
      clampJointRom(pose(200, 0), RANGE).flexion,
    ],
    [10, 90],
  );
  TestValidator.equals(
    "twist",
    [
      clampJointRom(pose(45, 50), RANGE).twist,
      clampJointRom(pose(45, -50), RANGE).twist,
    ],
    [30, -30],
  );
  TestValidator.equals(
    "inside",
    clampJointRom(pose(45, 20), RANGE),
    pose(45, 20),
  );
}
