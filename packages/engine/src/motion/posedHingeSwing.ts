import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import type { IPreparedChainPlant } from "./IPreparedChainPlant";

/**
 * Read the source hinge's swing as a model-space metre displacement. The end
 * is resolved at the source flexion and one degree more through the actual
 * clinical convention; their difference gives the authored bend-plane side
 * without assuming the hinge's sign. The mid joint lies opposite that swing
 * across the root-to-end line, so the no-hint fit uses root minus this vector.
 * Source joints use the existing first-record lookup and clinical zero when
 * absent. Source pose and prepared frames determine the result independently
 * of the target, so an unchanged workspace may share this reading.
 *
 * @param props Source pose, chain and clinical mappings; absent root/mid records use clinical zero.
 * @param prepared The chain's preparation.
 * @param axes The mid bone's axes; its flexion is the hinge.
 * @returns The end's displacement, model metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines model-metre end displacement, current-plane meaning, first-record source lookup, actual hinge convention and unchanged prepared-frame premise.
 * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics at the source flexion and one degree more reads the hinge's physical swing without assuming its clinical sign; their difference gives the authored bend-plane side used by two-bone IK.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One source-only FK reading owns the posed hinge swing, extracted from the swivel scorer so a workspace can share it without duplicating its mathematics.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses actual source joints, clinical mappings and prepared offsets. The existing first-record lookup and missing-joint clinical-zero convention are preserved; no target or generated pose is substituted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two first-record scans cost O(J) for J authored joints; one upper and two lower articulation compositions plus constant vector/quaternion work replace no candidate search and claim no measured speedup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The two source end readings share their exact fixed lower prefix and one lazily admitted lower factor/inner-product composer; both still check all clinical angles/frames and produce fresh outer products and end points. Source pose, chain, prepared ancestor/intermediate frames, axes and rest mappings determine the result independently of target. A workspace may reuse it only while those dependencies remain unchanged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one derived displacement and releases call-local FK values; it retains no input, cache, handle or task. Any longer reuse belongs to the caller's source workspace.
 */
export function posedHingeSwing(
  props: Pick<
    IFitChainToTargetProps,
    "pose" | "chain" | "jointAxes" | "restFrames"
  >,
  prepared: IPreparedChainPlant,
  axes: IAutoMovieJointAxes,
): IAutoMovieVector3 {
  const posed: (bone: IAutoMovieJointPose["bone"]) => IAutoMovieJointPose = (
    bone: IAutoMovieJointPose["bone"],
  ): IAutoMovieJointPose =>
    props.pose.joints.find(
      (j: IAutoMovieJointPose): boolean => j.bone === bone,
    ) ?? {
      bone,
      flexion: 0,
      abduction: 0,
      twist: 0,
    };
  const upperJoint: IAutoMovieJointPose = posed(props.chain.upper);
  const lowerJoint: IAutoMovieJointPose = posed(props.chain.lower);
  const above: IAutoMovieQuaternion = Quaternion.multiply(
    prepared.upper.worldRotation,
    jointToQuaternion(
      upperJoint,
      props.jointAxes?.[props.chain.upper],
      props.restFrames?.[props.chain.upper],
    ),
  );
  const mid: IAutoMovieVector3 = Vector3.add(
    prepared.upper.worldPosition,
    Quaternion.rotateVector(above, prepared.lowerOffset),
  );
  let prefix: IAutoMovieQuaternion | undefined;
  let composeLower: ReturnType<typeof jointToQuaternionOnBasis.prepare> | undefined;

  /** Admit the lower basis at its first original end reading, not before it. */
  const lowerRotation: (flexion: number) => IAutoMovieQuaternion = (
    flexion: number,
  ): IAutoMovieQuaternion => {
    const joint: IAutoMovieJointPose = { ...lowerJoint, flexion };
    composeLower ??= jointToQuaternionOnBasis.prepare(
      normalizeJointAxes(axes, "jointToQuaternion axes"),
      props.restFrames?.[props.chain.lower],
    );
    return composeLower(joint);
  };
  const end: (flexion: number) => IAutoMovieVector3 = (
    flexion: number,
  ): IAutoMovieVector3 =>
    Vector3.add(
      mid,
      Quaternion.rotateVector(
        Quaternion.multiply(
          prefix ??= Quaternion.multiply(above, prepared.lowerRotation),
          lowerRotation(flexion),
        ),
        prepared.effectorOffset,
      ),
    );
  const flexion: number = lowerJoint.flexion ?? 0;
  return Vector3.subtract(end(flexion + 1), end(flexion));
}
