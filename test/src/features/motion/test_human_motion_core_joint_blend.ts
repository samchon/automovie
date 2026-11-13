import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  getConstraint,
  jointRomOvershoot,
  jointToQuaternion,
  skeletonJointAxes,
} from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { type IHumanBody, blendHumanJoint } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A joint blended between two solutions moves steadily from one to the
 * other: the rotation the blended angles give never steps, whichever way
 * the two ends are written and wherever the path passes the shoulder's
 * 90 degrees of flexion, where two far-apart angle triples name nearly the
 * same arm.
 *
 * The readings are the right upper arm's clinical angles (flexion,
 * abduction, twist) blended at every hundredth of the way, each turned
 * into the joint's rotation with the engine's own conversion.
 *
 * Scenarios, on the average man and the small woman, for each pair of ends:
 * 1. The ends are returned as given.
 * 2. From one hundredth to the next the rotation turns by no more than
 *    three hundredths of the angle between the two ends, plus half a
 *    degree: three times the even share, so an eased path passes and a step
 *    does not.
 * 3. No blended rotation lies farther from both ends than the ends lie from
 *    each other, plus half a degree: the path stays between them.
 * 4. When both ends lie inside the joint's range of motion, every blended
 *    triple does too (the engine's `jointRomOvershoot` reads zero), so the
 *    resolver clamps none and the displayed arm is the blended one.
 *
 * The pairs: a hanging arm to one raised forward and out; an arm raised to
 * 80 degrees to one raised to 100, across the shoulder's 90; the two
 * triples measured 20 ms apart on a blown kiss leaving the lips (93.7,
 * 124.1, 90 and 85.9, -30, -72.4), which a film showed as a 35 mm step of
 * the wrist; and a hanging arm with the solved shoulder of a reach across
 * the body (130.5, 141.4, 90, on the edge of its twist), measured in
 * `test_human_motion_core_arm_carry_course`, whose arc left the range over
 * its last twenty-fifth and showed as a 33 mm step of the wrist.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the one owner of a joint blend and reads the rotations its angles give; a path that steps, or leaves the span of its ends, fails with the weight and the turn.
 * @evidence contracts/development/testing.md#independent-expectations The even share of the turn follows from what a blend is; the factor of three and the half degree allow an eased path and the conversion's rounding, and are stated. The third pair is a measured row of issue #3400, not a value from the blend.
 * @evidence contracts/development/testing.md#distinguishing-cases A pair in one chart, a pair across the chart's singular flexion, and a pair that is one arm in two charts; both ends, and one hundred interior weights.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic on two prepared bodies' joint axes; no performance is built.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the reading, the 4 scenarios with their bounds and where each pair comes from.
 */
export function test_human_motion_core_joint_blend(): void {
  const complaints: string[] = [];
  const PAIRS: readonly (readonly [
    string,
    readonly [number, number, number],
    readonly [number, number, number],
  ])[] = [
    ["a hanging arm to a raised one", [0, 0, 0], [120, 20, 0]],
    ["across 90 degrees of flexion", [80, -20, -60], [100, 20, -40]],
    [
      "the blown kiss's two readings",
      [93.7, 124.1, 90],
      [85.9, -30, -72.4],
    ],
    ["a hanging arm to a reach across the body", [0, 5, 0], [130.5, 141.4, 90]],
  ];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
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
    for (const [label, from, to] of PAIRS) {
      const blend = (share: number): readonly [number, number, number] =>
        blendHumanJoint(body, "rightUpperArm", from, to, share);

      // 1. The ends.
      if (
        blend(0).some((v: number, i: number): boolean => v !== from[i]) ||
        blend(1).some((v: number, i: number): boolean => v !== to[i])
      )
        complaints.push(
          `${name}: ${label}: the ends come back as ${blend(0).join(", ")} and ${blend(1).join(", ")}, the ends as given expected`,
        );

      // 2 and 3. The path between them.
      const whole: number = turn(rotation(from), rotation(to));
      let step: { value: number; at: number } = { value: 0, at: 0 };
      let stray: { value: number; at: number } = { value: 0, at: 0 };
      let previous: IAutoMovieQuaternion = rotation(from);
      for (let k: number = 1; k <= 100; ++k) {
        const here: IAutoMovieQuaternion = rotation(blend(k / 100));
        const value: number = turn(previous, here);
        if (value > step.value) step = { value, at: k / 100 };
        const away: number = Math.min(
          turn(here, rotation(from)),
          turn(here, rotation(to)),
        );
        if (away > stray.value) stray = { value: away, at: k / 100 };
        previous = here;
      }
      if (step.value > 0.03 * whole + 0.5)
        complaints.push(
          `${name}: ${label}: the rotation turns ${step.value.toFixed(2)} degrees in the hundredth ending at ${step.at.toFixed(2)}, at most ${(0.03 * whole + 0.5).toFixed(2)} expected (the ends are ${whole.toFixed(2)} degrees apart)`,
        );
      // 4. Between two ends inside the range, the path stays inside it.
      const out = (of: readonly [number, number, number]): number =>
        jointRomOvershoot(
          {
            bone: "rightUpperArm",
            flexion: of[0],
            abduction: of[1],
            twist: of[2],
          },
          getConstraint(
            "rightUpperArm",
            body.skeleton.bones.find(
              (b: IAutoMovieBone): boolean => b.bone === "rightUpperArm",
            )?.constraint ?? null,
          ),
        );
      if (out(from) === 0 && out(to) === 0) {
        let worst: { value: number; at: number } = { value: 0, at: 0 };
        for (let k: number = 1; k < 100; ++k) {
          const value: number = out(blend(k / 100));
          if (value > worst.value) worst = { value, at: k / 100 };
        }
        if (worst.value > 1e-6)
          complaints.push(
            `${name}: ${label}: at ${worst.at.toFixed(2)} the angles ${blend(
              worst.at,
            )
              .map((v: number): string => v.toFixed(1))
              .join(
                ", ",
              )} lie ${worst.value.toFixed(2)} degrees outside the joint's range, whose ends are both inside it`,
          );
      }
      if (stray.value > whole + 0.5)
        complaints.push(
          `${name}: ${label}: at ${stray.at.toFixed(2)} the rotation lies ${stray.value.toFixed(2)} degrees from the nearer end, whose distance from the other is ${whole.toFixed(2)}`,
        );
    }
  }
  TestValidator.equals(
    "a joint blends steadily between two solutions",
    complaints,
    [],
  );
}
