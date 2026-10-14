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
 * The skeleton resolver owns the shaped rest frames and clinical axes. The pose resolver calls this after its pelvis turn; the editor reads that same pose result. Removing the parent world rotation and then the local rest rotation gives the articulation consumed by the engine's existing inverse. This helper neither turns bones nor changes caller values. The legacy readout leaves final range validation to its pose caller; actualFrames delegates admissible-chart selection and range refusal to readHumanBodyAdmittedJointRotation. Its numbers describe this source rig, not measured personal joint capacity.
 *
 * Unchanged local frames retain exact authored coordinates. A shared flexion line permits scalar composition only for a constrained child's neutral abduction and twist. Unbounded root values always use the actual inverse, because a scalar sum can lose the tilt at enormous authored angles. The child proof is exact vector collinearity or its declared flexion landmark pair being the same bilateral hip line. This avoids a trigonometric round trip at exact sagittal endpoints. Other changed frames use the engine's double-precision inverse, including its finite/near-gimbal conventions. No mathematically certified angular uncertainty interval is claimed. A registered anatomical source graph can request `actualFrames`, which reads every performed frame through the same inverse instead of assuming that authored public rows already describe independent source articulation.
 *
 * @evidence contracts/common.md#principled-implementation Actual parent world and child rest rotations recover articulation; unchanged frames retain authored coordinates, and constrained neutral off-axis motion permits scalar composition only with a shared flexion-line proof.
 * @evidence contracts/common.md#clear-and-simple-design One source-rig traversal selects exact authored retention, proven sagittal composition or the shared inverse, with actualFrames explicitly forcing admission of performed source articulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unbounded root angles use actual rotation inversion, exact represented-axis identity does not certify upstream trigonometry, and returned source-rig coordinates measure no personal clinical capacity or angular uncertainty interval.
 * @evidence contracts/common.md#meaningful-documentation The comment states shared shaped frames, pelvis timing, unchanged-frame cases, constrained scalar proof, actualFrames behavior and the inverse's numerical conventions.
 * @evidence contracts/performance.md#efficient-algorithms The resolved-frame map builds linearly; each skeleton bone scans basis joints and authored rows, so current lookup work is O(B times (J+P)) plus bounded quaternion/axis operations per changed bone.
 * @evidence contracts/performance.md#reuse-equivalent-work The already resolved rig and pose are reused instead of performing another skeleton; frame lookup is mapped once and shared collinearity/inverse owners keep scalar and quaternion readouts consistent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned pose records belong to the caller; the resolved map, hip-line and articulation temporaries expire after the synchronous read, with no persistent rig cache, handle or task.
 */
export function readHumanBodyResolvedClinicalPose(
  input: IHumanBodyResolvedClinicalPoseInput,
): IAutoMovieJointPose[] {
  const { rig }: IHumanBodyResolvedClinicalPoseInput = input;
  const resolved: Map<
    IAutoMovieJointPose["bone"],
    IHumanBodyResolvedClinicalPoseInput["resolved"][number]
  > = new Map(
    input.resolved.map(
      (
        bone: IHumanBodyResolvedClinicalPoseInput["resolved"][number],
      ): [
        IAutoMovieJointPose["bone"],
        IHumanBodyResolvedClinicalPoseInput["resolved"][number],
      ] => [bone.bone, bone],
    ),
  );
  const root: (typeof rig.skeleton.bones)[number] = rig.skeleton.bones.find(
    (bone: (typeof rig.skeleton.bones)[number]): boolean =>
      bone.parent === null,
  )!;
  const upperLegs: readonly ["leftUpperLeg", "rightUpperLeg"] = [
    "leftUpperLeg",
    "rightUpperLeg",
  ] as const;
  const hips: ((typeof rig.skeleton.bones)[number] | undefined)[] =
    upperLegs.map(
      (
        name: (typeof upperLegs)[number],
      ): (typeof rig.skeleton.bones)[number] | undefined =>
        rig.skeleton.bones.find(
          (bone: (typeof rig.skeleton.bones)[number]): boolean =>
            bone.bone === name,
        ),
    );
  const hipLine: ReturnType<typeof Vector3.subtract> | undefined =
    input.tilt === 0
      ? undefined
      : Vector3.subtract(hips[0]!.rest.translation, hips[1]!.rest.translation);
  return rig.skeleton.bones
    .filter(
      (bone: (typeof rig.skeleton.bones)[number]): boolean =>
        input.basis.joints.find(
          (joint: (typeof input.basis.joints)[number]): boolean =>
            joint.bone === bone.bone,
        )!.shoulder === undefined,
    )
    .map((bone: (typeof rig.skeleton.bones)[number]): IAutoMovieJointPose => {
      const contract: IHumanBodyResolvedClinicalPoseInput["basis"]["joints"][number] =
        input.basis.joints.find(
          (joint: (typeof input.basis.joints)[number]): boolean =>
            joint.bone === bone.bone,
        )!;
      const row: IAutoMovieJointPose | undefined = input.pose.find(
        (joint: IAutoMovieJointPose): boolean => joint.bone === bone.bone,
      );
      const original: IAutoMovieJointPose & {
        flexion: number;
        abduction: number;
        twist: number;
      } = {
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
        const localAxis: ReturnType<typeof Quaternion.rotateVector> =
          Quaternion.rotateVector(
            Quaternion.inverse(bone.rest.rotation),
            hipLine!,
          );
        const flexionAxis: typeof DEFAULT_JOINT_AXES.flexion = (
          rig.axes[bone.bone] ?? DEFAULT_JOINT_AXES
        ).flexion;
        const sharedNames: string[] = upperLegs.map(
          (name: (typeof upperLegs)[number]): string =>
            input.basis.joints.find(
              (joint: (typeof input.basis.joints)[number]): boolean =>
                joint.bone === name,
            )!.head,
        );
        const declaredLine: boolean =
          contract.flexionAxis !== undefined &&
          contract.flexionAxis.every(
            (name: string, index: number): boolean =>
              name === sharedNames[index] || name === sharedNames[1 - index],
          );
        const collinear: boolean =
          declaredLine || humanBodyFlexionAxesCollinear(localAxis, flexionAxis);
        const sagittal: boolean =
          original.abduction === contract.neutral.abduction &&
          original.twist === contract.neutral.twist;
        if (collinear && sagittal) {
          const direction: number =
            Vector3.dot(localAxis, flexionAxis) > 0 ? 1 : -1;
          return {
            ...original,
            flexion:
              original.flexion +
              input.tilt * direction * contract.signs.flexion,
          };
        }
      }
      const actual: IHumanBodyResolvedClinicalPoseInput["resolved"][number] =
        resolved.get(bone.bone)!;
      const parent:
        | IHumanBodyResolvedClinicalPoseInput["resolved"][number]
        | undefined =
        bone.parent === null ? undefined : resolved.get(bone.parent)!;
      const local: ReturnType<typeof Quaternion.multiply> = Quaternion.multiply(
        parent === undefined
          ? Quaternion.identity()
          : Quaternion.inverse(parent.worldRotation),
        actual.worldRotation,
      );
      const articulation: ReturnType<typeof Quaternion.multiply> =
        Quaternion.multiply(Quaternion.inverse(bone.rest.rotation), local);
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
