import {
  DEFAULT_JOINT_AXES,
  Quaternion,
  Vector3,
  decomposeJointRotation,
} from "@automovie/engine";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IHumanBodyResolvedClinicalPoseInput } from "./IHumanBodyResolvedClinicalPoseInput";
import { humanBodyFlexionAxesCollinear } from "./humanBodyFlexionAxesCollinear";
import { readHumanBodyAdmittedJointRotation } from "./readHumanBodyAdmittedJointRotation";

/**
 * Read clinical coordinates from the actual resolved parent and child frames.
 *
 * The skeleton resolver owns the shaped rest frames and clinical axes. The
 * pose resolver calls this after its pelvis turn; the editor reads that same
 * pose result. Removing the parent world rotation and then the local rest
 * rotation gives the articulation consumed by the engine's existing inverse.
 * This helper does not turn bones, change caller values or judge a range.
 * Its numbers describe this source rig, not measured personal joint capacity.
 *
 * Unchanged local frames retain exact authored coordinates. A shared flexion
 * line permits scalar composition only for a constrained child's neutral
 * abduction and twist. Unbounded root values always use the actual inverse,
 * because a scalar sum can lose the tilt at enormous authored angles. The
 * child proof is exact vector collinearity or its declared flexion landmark
 * pair being the same bilateral hip line. This avoids a trigonometric round
 * trip at exact sagittal endpoints. Other changed frames use the engine's
 * double-precision inverse, including its finite/near-gimbal conventions.
 * No mathematically certified angular uncertainty interval is claimed.
 * A registered anatomical source graph can request `actualFrames`, which
 * reads every performed frame through the same inverse instead of assuming
 * that authored public rows already describe independent source articulation.
 */
export function readHumanBodyResolvedClinicalPose(
  input: IHumanBodyResolvedClinicalPoseInput,
): IAutoMovieJointPose[] {
  const { rig } = input;
  const resolved = new Map(input.resolved.map((bone) => [bone.bone, bone]));
  const root = rig.skeleton.bones.find((bone) => bone.parent === null)!;
  const upperLegs = ["leftUpperLeg", "rightUpperLeg"] as const;
  const hips = upperLegs.map((name) =>
    rig.skeleton.bones.find((bone) => bone.bone === name),
  );
  const hipLine =
    input.tilt === 0
      ? undefined
      : Vector3.subtract(hips[0]!.rest.translation, hips[1]!.rest.translation);
  return rig.skeleton.bones
    .filter(
      (bone) =>
        input.basis.joints.find((joint) => joint.bone === bone.bone)!
          .shoulder === undefined,
    )
    .map((bone) => {
      const contract = input.basis.joints.find(
        (joint) => joint.bone === bone.bone,
      )!;
      const row = input.pose.find((joint) => joint.bone === bone.bone);
      const original = {
        bone: bone.bone,
        flexion: row?.flexion ?? contract.neutral.flexion,
        abduction: row?.abduction ?? contract.neutral.abduction,
        twist: row?.twist ?? contract.neutral.twist,
      };
      if (
        input.actualFrames !== true &&
        (input.tilt === 0 ||
          (bone.bone !== root.bone && bone.parent !== root.bone))
      )
        return original;
      // The current closed humanoid set supplies every nonroot's override or
      // engine default range; only the root is unbounded.
      if (input.actualFrames !== true && bone.parent === root.bone) {
        const localAxis = Quaternion.rotateVector(
          Quaternion.inverse(bone.rest.rotation),
          hipLine!,
        );
        const flexionAxis = (rig.axes[bone.bone] ?? DEFAULT_JOINT_AXES).flexion;
        const sharedNames = upperLegs.map(
          (name) =>
            input.basis.joints.find((joint) => joint.bone === name)!.head,
        );
        const declaredLine =
          contract.flexionAxis !== undefined &&
          contract.flexionAxis.every(
            (name, index) =>
              name === sharedNames[index] || name === sharedNames[1 - index],
          );
        const collinear =
          declaredLine || humanBodyFlexionAxesCollinear(localAxis, flexionAxis);
        const sagittal =
          original.abduction === contract.neutral.abduction &&
          original.twist === contract.neutral.twist;
        if (collinear && sagittal) {
          const direction = Vector3.dot(localAxis, flexionAxis) > 0 ? 1 : -1;
          return {
            ...original,
            flexion:
              original.flexion +
              input.tilt * direction * contract.signs.flexion,
          };
        }
      }
      const actual = resolved.get(bone.bone)!;
      const parent =
        bone.parent === null ? undefined : resolved.get(bone.parent)!;
      const local = Quaternion.multiply(
        parent === undefined
          ? Quaternion.identity()
          : Quaternion.inverse(parent.worldRotation),
        actual.worldRotation,
      );
      const articulation = Quaternion.multiply(
        Quaternion.inverse(bone.rest.rotation),
        local,
      );
      return {
        bone: bone.bone,
        ...(input.actualFrames === true
          ? readHumanBodyAdmittedJointRotation(rig, original, articulation)
          : decomposeJointRotation(
              articulation,
              rig.axes[bone.bone],
              rig.frames[bone.bone],
            )),
      };
    });
}
