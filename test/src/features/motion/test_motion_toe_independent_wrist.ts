import { Quaternion, Vector3, preparePoseResolution } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanHand,
  bend,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { prepareBendGoal } from "../../../../packages/motions/src/everyday/prepareBendGoal";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Recover the material palm frame independently of the carried wrist builder.
 *
 * Scenarios:
 * 1. Both feet at zero and quarter-turn heading supply the palm point, normal and finger tangent.
 * 2. A shared same-pose frame preserves every wrist coordinate, including signed zeros.
 * 3. A foreign reader is invoked on actual demand and a throwing supplier propagates its original error.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the carried palm geometry and the same-pose and supplier cases.
 * @evidence contracts/development/testing.md#behavioral-verification Reconstructs the actual palm from the returned wrist and the local hand geometry.
 * @evidence contracts/development/testing.md#independent-expectations Direct bone rotation and vector projection give the expected site, normal and finger direction without the wrist builder.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite feet, translated and rotated poses, exact same-pose reuse, and foreign supplier success and failure pin the changed branches.
 * @evidence contracts/development/testing.md#execution-ownership One body and four upright poses test the goal primitive without preparing an entire action.
 */
export function test_motion_toe_independent_wrist(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const origin: IAutoMovieVector3 = { x: 1, y: 0, z: -1 };
  const sentinel: Error = new Error("opaque wrist reader");
  for (const side of ["left", "right"] as const) {
    const site: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[side === "left" ? "footTopLeft" : "footTopRight"];
    const read: ReturnType<typeof prepareBendGoal> = prepareBendGoal(
      body,
      side,
      origin,
      site,
      bend.REACH_OUT,
    );
    const palm: ReturnType<typeof HumanHand.offset> = HumanHand.offset(
      body,
      side,
      "palm",
      "flat",
    );
    for (const yaw of [0, 90]) {
      const posture: IAutoMovieMotionHumanPosture = stand.posture(
        body,
        origin,
        yaw,
      );
      const frames: ReturnType<typeof poseBones> = poseBones(
        body,
        resolveHumanPosture(body, posture),
      );
      const foot: IAutoMovieResolvedBone = frames.get(site.bone)!;
      const skin: IAutoMovieVector3 = Vector3.add(
        foot.worldPosition,
        Quaternion.rotateVector(foot.worldRotation, site.point),
      );
      const normal: IAutoMovieVector3 = Quaternion.rotateVector(
        foot.worldRotation,
        site.normal,
      );
      const shoulder: IAutoMovieVector3 = frames.get(
        `${side}UpperArm`,
      )!.worldPosition;
      const approach: IAutoMovieVector3 = Vector3.subtract(skin, shoulder);
      const tangent: IAutoMovieVector3 = Vector3.normalize(
        Vector3.addScaled(approach, normal, -Vector3.dot(approach, normal)),
      );

      let reads: number = 0;
      const wrist: IAutoMovieHumanLimbGoal = read(posture, () => {
        ++reads;
        return preparePoseResolution();
      });
      TestValidator.equals("one effective foreign supplier read", reads, 1);
      const shared: IAutoMovieHumanLimbGoal = read(
        posture,
        undefined,
        undefined,
        frames,
      );
      const expected: number[] = coordinates(wrist);
      TestValidator.predicate(
        "sharing retains each wrist coordinate and the sign of zero",
        coordinates(shared).every((value: number, index: number): boolean =>
          Object.is(value, expected[index]),
        ),
      );

      const rotation: IAutoMovieQuaternion = shared.rotation!;
      const actual: IAutoMovieVector3 = Vector3.add(
        shared.point,
        Quaternion.rotateVector(rotation, palm.point),
      );
      const deltas: readonly IAutoMovieVector3[] = [
        Vector3.subtract(actual, skin),
        Vector3.add(Quaternion.rotateVector(rotation, palm.normal), normal),
        Vector3.subtract(
          Quaternion.rotateVector(rotation, palm.forward),
          tangent,
        ),
      ];
      TestValidator.predicate(
        "palm coincides with the material frame to floating-point precision",
        deltas.every(
          (delta: IAutoMovieVector3): boolean =>
            Vector3.length(delta) <= 64 * Number.EPSILON,
        ),
      );

      let thrown: unknown;
      try {
        read(posture, () => {
          throw sentinel;
        });
      } catch (error) {
        thrown = error;
      }
      TestValidator.predicate(
        "foreign supplier error is propagated",
        thrown === sentinel,
      );
    }
  }
}

/** Signed scalar coordinates of the complete wrist goal and its contact. */
function coordinates(goal: IAutoMovieHumanLimbGoal): number[] {
  const { point, bend, rotation, contact } = goal;
  return [
    point.x,
    point.y,
    point.z,
    bend.x,
    bend.y,
    bend.z,
    rotation!.x,
    rotation!.y,
    rotation!.z,
    rotation!.w,
    contact!.x,
    contact!.y,
    contact!.z,
  ];
}
