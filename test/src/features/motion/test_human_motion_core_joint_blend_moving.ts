import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  jointToQuaternion,
  skeletonJointAxes,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { type IHumanBody, blendHumanJoint } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A joint blended between two ends that move keeps one course: as an end
 * turns a little, the blended rotation turns a little, whichever reading the
 * end is written in.
 *
 * An overlay that fades in over a walk blends the body without it and the
 * body with it, and both move. The right upper arm is blended at fixed
 * shares between a hanging arm (0, 5, 0) and a far end that travels, in
 * 2000 equal steps of its angles, from an arm raised forward and a little
 * out (60, 20, -30) to the solved shoulder of a reach across the body
 * (130.5, 141.4, 90), which a three-angle box admits only in the other
 * reading from the hanging arm's: the travel crosses the place where a blend
 * of angles had to change the way it went.
 *
 * Scenarios, on the average man, at the shares 0.25, 0.5 and 0.75:
 * 1. The far end's own rotation turns less than a fifth of a degree from
 *    one step to the next (the premise: the end moves little).
 * 2. From one step to the next the blended rotation turns no more than
 *    1 degree, about the continuity audit's 5 mm at the elbow of an upper
 *    arm 0.3 m long. A blend that chose between two ways stepped by the
 *    distance between them, 5 degrees and more.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the one owner of a joint blend over a travelling end and reads the rotations its angles give; a blend that switches route at one step fails with the step, the share and the turn.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the audit's distance at an upper arm's length, stated; the premise is measured on the end itself; nothing is read from the blend's choice.
 * @evidence contracts/development/testing.md#distinguishing-cases Three shares of the way and 2000 places of the far end, from an end beside the near one to one written in the other reading. Ends that hold still are `test_human_motion_core_joint_blend`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic on one prepared body's joint axes; no performance is built.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, where it comes from, the travel of the far end and the 2 scenarios with their bounds.
 */
export function test_human_motion_core_joint_blend_moving(): void {
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const axes: IAutoMovieJointAxes | undefined = skeletonJointAxes(
    body.skeleton,
    HUMANOID_JOINT_AXES,
  ).rightUpperArm;
  const rotation = (
    of: readonly [number, number, number],
  ): IAutoMovieQuaternion =>
    Quaternion.normalize(
      jointToQuaternion(
        { flexion: of[0], abduction: of[1], twist: of[2] },
        axes,
        HUMANOID_REST_FRAME.rightUpperArm,
      ),
    );
  const turn = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
    (2 *
      Math.acos(
        Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)),
      ) *
      180) /
    Math.PI;
  const HANGING: readonly [number, number, number] = [0, 5, 0];
  const RAISED: readonly [number, number, number] = [60, 20, -30];
  const ACROSS: readonly [number, number, number] = [130.5, 141.4, 90];
  const STEPS: number = 2000;
  const far = (k: number): readonly [number, number, number] => [
    RAISED[0] + ((ACROSS[0] - RAISED[0]) * k) / STEPS,
    RAISED[1] + ((ACROSS[1] - RAISED[1]) * k) / STEPS,
    RAISED[2] + ((ACROSS[2] - RAISED[2]) * k) / STEPS,
  ];

  // 1. The premise.
  let moved: number = 0;
  for (let k: number = 1; k <= STEPS; ++k)
    moved = Math.max(moved, turn(rotation(far(k - 1)), rotation(far(k))));
  if (moved > 0.2)
    complaints.push(
      `the far end turns ${moved.toFixed(3)} degrees in one step, under 0.2 expected of the travel`,
    );

  for (const share of [0.25, 0.5, 0.75] as const) {
    const blend = (k: number): readonly [number, number, number] =>
      blendHumanJoint(body, "rightUpperArm", HANGING, far(k), share);

    // 2. No step.
    let step: { value: number; at: number } = { value: 0, at: 0 };
    let previous: IAutoMovieQuaternion = rotation(blend(0));
    for (let k: number = 1; k <= STEPS; ++k) {
      const here: IAutoMovieQuaternion = rotation(blend(k));
      const value: number = turn(previous, here);
      if (value > step.value) step = { value, at: k };
      previous = here;
    }
    if (step.value > 1)
      complaints.push(
        `at share ${share}: the blended rotation turns ${step.value.toFixed(2)} degrees at step ${step.at} of ${STEPS}, between the angles ${blend(
          step.at - 1,
        )
          .map((v: number): string => v.toFixed(1))
          .join("/")} and ${blend(step.at)
          .map((v: number): string => v.toFixed(1))
          .join("/")}; within 1 degree expected`,
      );
  }
  TestValidator.equals(
    "a joint blended between moving ends keeps one course",
    complaints,
    [],
  );
}
