import {
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type {
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEngineKinematics.scanJointRom` reports each axis fault in axis order with its distance past
 * the limit; `overshoot` sums them.
 *
 * Constraint: flexion [-10, 20], abduction [0, 30], twist immobile.
 *
 * Scenarios:
 *
 * 1. A joint inside, and a joint at rest (null), report nothing.
 * 2. Flexion 50, abduction -5 and twist 7 report (flexion, 50, 30), (abduction,
 *    -5, 5), (twist, 7, 7) in that order, and the overshoot sum is 42.
 * 3. A twist of 0 on the immobile axis is its rest and reports nothing.
 */
export function test_engine_rom_scan_joint_rom(): void {
  const constraint: IAutoMovieJointConstraint = {
    flexion: { min: -10, max: 20 },
    abduction: { min: 0, max: 30 },
    twist: null,
  };
  const pose = (
    flexion: number | null,
    abduction: number | null,
    twist: number | null,
  ): IAutoMovieJointPose => ({
    bone: "leftUpperArm",
    flexion,
    abduction,
    twist,
  });
  const scan = (
    joint: IAutoMovieJointPose,
  ): [string, number, number | undefined][] => {
    const faults: [string, number, number | undefined][] = [];
    AutoMovieEngineKinematics.scanJointRom(joint, constraint, (part, actual, overshoot) => {
      faults.push([part, actual, overshoot]);
    });
    return faults;
  };
  TestValidator.equals("inside", scan(pose(5, 10, 0)), []);
  TestValidator.equals("rest", scan(pose(null, null, null)), []);
  TestValidator.equals("faults", scan(pose(50, -5, 7)), [
    ["flexion", 50, 30],
    ["abduction", -5, 5],
    ["twist", 7, 7],
  ]);
  TestValidator.equals(
    "sum",
    AutoMovieEngineKinematics.scanJointRomOvershoot(pose(50, -5, 7), constraint),
    42,
  );
}
