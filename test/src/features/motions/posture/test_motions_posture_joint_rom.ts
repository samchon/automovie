import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  prepareHumanJointRom
} from "../../../../../packages/motions/src/posture/internal/prepareHumanJointRom";
import {
  prepareHumanPostureProjection
} from "../../../../../packages/motions/src/posture/internal/prepareHumanPostureProjection";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/** Rounding of a range projection and its overshoot, degrees. */
const ROUNDING: number = 1e-6;

/** Joints of every kind: hinges, ball joints and the spine's segments. */
const BONES: readonly AutoMovieHumanoidBone[] = [
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "leftUpperLeg",
  "leftLowerLeg",
  "leftFoot",
  "spine",
  "neck",
];

/** Clinical angles past every one of those joints' ranges. */
const WILD: readonly [number, number, number] = [170, 120, 170];

/** Clinical angles inside every one of them: a small flexion alone. */
const MILD: readonly [number, number, number] = [10, 0, 0];

/** A pose of the bones at the same clinical angles. */
function pose(
  body: IAutoMovieMotionHumanBody,
  angles: readonly [number, number, number],
): IAutoMoviePose {
  return {
    skeleton: body.skeleton.id,
    root: null,
    joints: BONES.map(
      (bone: AutoMovieHumanoidBone): IAutoMovieJointPose => ({
        bone,
        flexion: angles[0],
        abduction: angles[1],
        twist: angles[2],
      }),
    ),
  };
}

/** A joint's clinical angles, a missing one read as NaN so it never matches. */
function angles(joint: IAutoMovieJointPose): [number, number, number] {
  return [joint.flexion ?? NaN, joint.abduction ?? NaN, joint.twist ?? NaN];
}

/**
 * The body's range of motion: `prepareHumanJointRom` reads how far a joint's
 * clinical angles lie outside its range, degrees, zero inside; the body's ROM
 * projection (`prepareHumanPostureProjection`) brings every joint of a pose
 * into its range, leaves a joint already inside unchanged, and projecting twice
 * is projecting once.
 *
 * The body is built whole (`humanFixtureBody`): the ranges are its rig's
 * constraints.
 *
 * Scenarios, the average man's arm, leg, spine and neck joints:
 *
 * 1. At (170, 120, 170) degrees every joint overshoots its range; at a 10-degree
 *    flexion none does.
 * 2. Projected, every joint of the wild pose has no overshoot.
 * 3. Projecting the projected pose changes no angle.
 * 4. The mild pose projects onto itself.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines positive range excess outside the rig and idempotent projection onto legal joint coordinates.
 * @evidence contracts/development/testing.md#behavioral-verification Measures mild and extreme postures across rig joints, projects the latter twice and checks the mild input.
 * @evidence contracts/development/testing.md#independent-expectations Specified rig bounds identify each extreme before projection. Legal poses show zero excess and rerunning projection cannot change their coordinates.
 */
export async function test_motions_posture_joint_rom(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const rom: ReturnType<typeof prepareHumanJointRom> =
    prepareHumanJointRom(body);
  const project: (pose: IAutoMoviePose) => IAutoMoviePose =
    prepareHumanPostureProjection(body);

  // 1. The overshoot reader.
  TestValidator.predicate(
    "past the range and inside it",
    BONES.every(
      (bone: AutoMovieHumanoidBone): boolean =>
        rom(bone, WILD) > ROUNDING && nclose(rom(bone, MILD), 0, ROUNDING),
    ),
  );

  // 2. Into range.
  const projected: IAutoMoviePose = project(pose(body, WILD));
  const joint = (
    of: IAutoMoviePose,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieJointPose =>
    of.joints.find((j: IAutoMovieJointPose): boolean => j.bone === bone)!;
  TestValidator.predicate(
    "every projected joint within its range",
    BONES.every((bone: AutoMovieHumanoidBone): boolean =>
      nclose(rom(bone, angles(joint(projected, bone))), 0, ROUNDING),
    ),
  );

  // 3. Idempotent.
  const twice: IAutoMoviePose = project(projected);
  const same = (a: IAutoMoviePose, b: IAutoMoviePose): boolean =>
    BONES.every((bone: AutoMovieHumanoidBone): boolean => {
      const x: number[] = angles(joint(a, bone));
      const y: number[] = angles(joint(b, bone));
      return x.every((v: number, i: number): boolean =>
        nclose(v, y[i]!, ROUNDING),
      );
    });
  TestValidator.predicate("projecting twice is once", same(twice, projected));

  // 4. Inside, unchanged.
  const mild: IAutoMoviePose = pose(body, MILD);
  TestValidator.predicate(
    "a pose in range is left as it is",
    same(project(mild), mild),
  );
}
