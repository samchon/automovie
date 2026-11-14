import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The forearm's twist reading: with the arm hanging at the side and the
 * elbow flexed 90 degrees, twist 0 holds the thumb up (the forearm's
 * mid-position), -90 turns the palm up (full supination) and +90 the palm
 * down (full pronation), so the rig's `[-90, 90]` is the clinical 90/90 span
 * about the neutral forearm. The T-pose's palm-down hand is that neutral
 * forearm on an abducted arm: from the anatomical position (palm forward,
 * fully supinated) the arm abducted 90 degrees keeps its palm forward, and
 * turning it down is 90 degrees of pronation from full supination.
 *
 * Scenarios, on both arms of the average man:
 * 1. At twist 0 the thumb's axis points within 15 degrees of the world's up.
 * 2. At twist -90 the palm faces within 15 degrees of the world's up.
 * 3. At twist +90 the palm faces within 15 degrees of the world's down.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves real postures and reads the displayed hand's axes; a twist reading turned by a quarter turn or mirrored on one side fails with the angles.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the clinical forearm positions (mid-position thumb up with the elbow at 90, supination palm up, pronation palm down), not the rig's numbers.
 * @evidence contracts/development/testing.md#distinguishing-cases Both arms, the neutral and both ends.
 * @evidence contracts/development/testing.md#execution-ownership Six posture solves on one prepared body, in memory; the test program discovers every `test_` function under `features`, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the convention, its reason and the 3 scenarios with their bound.
 */
export function test_human_motion_core_forearm_twist(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const base: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const complaints: string[] = [];
  const degrees = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    (Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          (a.x * b.x + a.y * b.y + a.z * b.z) /
            (Math.hypot(a.x, a.y, a.z) * Math.hypot(b.x, b.y, b.z)),
        ),
      ),
    ) *
      180) /
    Math.PI;
  for (const side of ["left", "right"] as const)
    for (const [twist, axis, toward] of [
      [0, "thumb", { x: 0, y: 1, z: 0 }],
      [-90, "palm", { x: 0, y: 1, z: 0 }],
      [90, "palm", { x: 0, y: -1, z: 0 }],
    ] as const) {
      const { [`${side}Arm` as const]: _, ...limbs } = base.limbs;
      void _;
      const posture: IHumanPosture = {
        ...base,
        joints: {
          ...base.joints,
          [`${side}UpperArm`]: [0, 0, 0],
          [`${side}LowerArm`]: [90, 0, twist],
          [`${side}Hand`]: [0, 0, 0],
        },
        limbs,
      };
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, resolveHumanPosture(body, posture));
      const shown: IAutoMovieVector3 = Quaternion.rotateVector(
        bones.get(`${side}Hand`)!.worldRotation,
        AutoMovieMotionHumanTouchEffector.axis(side, axis),
      );
      const off: number = degrees(shown, toward);
      if (!(off <= 15))
        complaints.push(
          `${side} forearm at twist ${twist}: the ${axis} points ${off.toFixed(1)} deg from ${toward.y > 0 ? "up" : "down"}, within 15 expected (shown (${shown.x.toFixed(2)}, ${shown.y.toFixed(2)}, ${shown.z.toFixed(2)}))`,
        );
    }
  TestValidator.equals(
    "the forearm's twist reads its clinical turn",
    complaints,
    [],
  );
}
