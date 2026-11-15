import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  ROM_TOLERANCE,
  jointToQuaternion,
  skeletonJointAxes,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { type IHumanBody, blendHumanJoint } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An upper arm blended between two solutions moves continuously in the
 * displayed rotation where its clinical triple passes 90 degrees of
 * flexion, the chart's gimbal, whichever reading each end is written in
 * (#3400).
 *
 * Scenarios, on the average man's right shoulder, each pair blended at the
 * shares 0, 0.01, ..., 1:
 * 1. The blown kiss's ends as the hand leaves the lips, measured on #3400:
 *    (93.7, 124.1, 90) and (85.9, -30, -72.4) degrees.
 * 2. The drink's two readings of one goal (`blendHumanJoint`'s own case):
 *    (85.8, 145.4, 87.1) and (94.6, -26.7, -84.6).
 * 3. The two readings of a raised arm: (90, -30, -57) and (95, 112, 90).
 *
 * In each, both ends are met within the joints' angular resolution
 * (`ROM_TOLERANCE`, 0.01 degrees), and no step of 0.01 turns the displayed
 * rotation by more than 0.05 of the angle between the ends plus that
 * resolution: five times the uniform share, the bound a blend on the
 * range's chart (`swingTwistRange.blend`), which is not
 * constant-speed in the rotation, keeps while staying continuous; the jump
 * of #3400 turned the arm by most of the angle between the ends in one step.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Blends the public `blendHumanJoint` on a polygon man's shoulder and reads the displayed rotation through the engine's own joint conversion; a step past the bound or an end missed fails with the pair, the share and the angles.
 * @evidence contracts/development/testing.md#independent-expectations The pairs are the readings #3400 and the blend's own documentation measured; the step bound is a multiple of the uniform share stated with its reason, and the ends' bound is the joints' resolution (`ROM_TOLERANCE`).
 * @evidence contracts/development/testing.md#distinguishing-cases Three pairs across the gimbal, each with its ends in different readings.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and runs 303 blends, under a second; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the invariant, the defect it guards and the 3 scenarios.
 */
export function test_human_motion_core_shoulder_blend(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const bone: AutoMovieHumanoidBone = "rightUpperArm";
  const axes: IAutoMovieJointAxes | undefined = skeletonJointAxes(
    body.skeleton,
    HUMANOID_JOINT_AXES,
  )[bone];
  const rotation = (
    of: readonly [number, number, number],
  ): IAutoMovieQuaternion =>
    Quaternion.normalize(
      jointToQuaternion(
        { flexion: of[0], abduction: of[1], twist: of[2] },
        axes,
        HUMANOID_REST_FRAME[bone],
      ),
    );
  const angle = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
    (2 *
      Math.acos(
        Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)),
      ) *
      180) /
    Math.PI;
  const pairs: [string, [number, number, number], [number, number, number]][] =
    [
      ["blown kiss", [93.7, 124.1, 90], [85.9, -30, -72.4]],
      ["drink", [85.8, 145.4, 87.1], [94.6, -26.7, -84.6]],
      ["raised arm", [90, -30, -57], [95, 112, 90]],
    ];
  const complaints: string[] = [];
  for (const [name, from, to] of pairs) {
    const span: number = angle(rotation(from), rotation(to));
    let previous: IAutoMovieQuaternion = rotation(from);
    for (let i: number = 0; i <= 100; i++) {
      const now: IAutoMovieQuaternion = rotation(
        blendHumanJoint(body, bone, from, to, i / 100),
      );
      const step: number = angle(previous, now);
      if (i === 0 && step > ROM_TOLERANCE)
        complaints.push(`${name}: the blend starts ${step} degrees off its start`);
      if (step > 0.05 * span + ROM_TOLERANCE)
        complaints.push(
          `${name}: the arm turns ${step.toFixed(3)} degrees at share ${(i / 100).toFixed(2)}, over ${(0.05 * span).toFixed(3)} (ends ${span.toFixed(3)} apart)`,
        );
      previous = now;
    }
    const end: number = angle(previous, rotation(to));
    if (end > ROM_TOLERANCE)
      complaints.push(`${name}: the blend ends ${end} degrees off its end`);
  }
  TestValidator.equals(
    "a shoulder blends continuously across its chart's gimbal",
    complaints,
    [],
  );
}
