import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jointToQuaternion } from "../kinematics/internal/jointToQuaternion";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { normalizeJointAxes } from "../kinematics/internal/normalizeJointAxes";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Read the source hinge's swing as a model-space metre displacement. The end is
 * resolved at the source flexion and one degree more through the actual
 * clinical convention; their difference gives the authored bend-plane side
 * without assuming the hinge's sign. The mid joint lies opposite that swing
 * across the root-to-end line, so the no-hint fit uses root minus this vector.
 * Source joints use the existing first-record lookup and clinical zero when
 * absent. Source pose and prepared frames determine the result independently of
 * the target, so an unchanged workspace may share this reading.
 *
 * @param props Source pose, chain and clinical mappings; absent root/mid
 *   records use clinical zero.
 * @param prepared The chain's preparation.
 * @param axes The mid bone's axes; its flexion is the hinge.
 * @returns The end's displacement, model metres.
 */
export function posedHingeSwing(
  props: Pick<
    IAutoMovieFitChainToTargetProps,
    "pose" | "chain" | "jointAxes" | "restFrames"
  >,
  prepared: IAutoMoviePreparedChainPlant,
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
  let composeLower:
    | ReturnType<typeof jointToQuaternionOnBasis.prepare>
    | undefined;

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
          (prefix ??= Quaternion.multiply(above, prepared.lowerRotation)),
          lowerRotation(flexion),
        ),
        prepared.effectorOffset,
      ),
    );
  const flexion: number = lowerJoint.flexion ?? 0;
  return Vector3.subtract(end(flexion + 1), end(flexion));
}
