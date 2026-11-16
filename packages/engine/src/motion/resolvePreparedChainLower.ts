import type {
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieChainBone } from "../kinematics/IAutoMovieChainBone";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IPreparedChainPlant } from "./IPreparedChainPlant";
import type { ISolvePreparedChainPlantProps } from "./ISolvePreparedChainPlantProps";
import type { prepareChainFit } from "./prepareChainFit";

/** Two supplied articulations under one unchanged prepared parent frame. */
interface IProps extends Pick<
  ISolvePreparedChainPlantProps,
  "prepared" | "jointAxes" | "restFrames"
> {
  /** Root clinical articulation, with null axes at their declared rest. */
  upper: IAutoMovieJointPose;

  /** Mid clinical articulation in the same axes and rest-frame convention. */
  lower: IAutoMovieJointPose;

  /** Optional lazy basis owner of this exact unchanged rig and mappings. */
  rig?: prepareChainFit.IRig;
}

/**
 * Resolve only a prepared chain's mid frame after its two supplied articulations.
 * Parent and intermediate bones must remain as they were during preparation.
 * An optional matching rig shares the basis admission; both current joint
 * articulations are still converted in their original order on every read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two clinical inputs, unchanged-frame premise and model-space output through IAutoMovieChainBone.
 * @evidence contracts/development/implementation.md#principled-implementation Composes the captured root world rotation, root articulation, fixed root-to-mid transform and mid articulation in the same order as parent-first FK; rigid intermediate transforms are already captured by preparation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This two-joint FK prefix is shared by the candidate point reader and the final chain-frame reader, so neither owns another reconstruction rule.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads actual supplied clinical articulations through the same axes and rest frames as preparation; no ideal IK target or canonical limb transform substitutes for FK.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two clinical quaternion conversions and a fixed number of vector/quaternion compositions take constant work, without resolving unrelated bones or the effector's articulation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Prepared offsets/parent frames and optionally matching normalized bases are borrowed unchanged; callers reading point and rotation can pass the completed prefix to resolvePreparedChainEffector. Changed mappings need a new rig context.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh frame and retains no input or handle after the call.
 */
export function resolvePreparedChainLower(props: IProps): IAutoMovieChainBone {
  /** Reuse admitted bases without changing the original clinical-record order. */
  const rotation: (
    joint: IAutoMovieJointPose,
    bone: IAutoMovieJointPose["bone"],
  ) => IAutoMovieQuaternion = (
    joint: IAutoMovieJointPose,
    bone: IAutoMovieJointPose["bone"],
  ): IAutoMovieQuaternion =>
    props.rig === undefined
      ? jointToQuaternion(
          joint,
          props.jointAxes?.[bone],
          props.restFrames?.[bone],
        )
      : jointToQuaternionOnBasis(
          joint,
          props.rig.jointBasis(bone, "jointToQuaternion axes"),
          props.restFrames?.[bone],
        );
  return resolvePreparedChainLower.fromRotations(
    props.prepared,
    rotation(props.upper, props.prepared.chain.upper),
    rotation(props.lower, props.prepared.chain.lower),
  );
}

/**
 * The shared two-joint FK prefix for records or already admitted articulations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes clinical-record conversion from the composed quaternion prefix.
 * @evidence contracts/development/design.md#principled-representation Admitted articulations and prepared rigid frames determine the same mid frame independently of the source record order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The candidate reader converts two records, while the full chain reader admits duplicate records in authored order and reuses their last quaternions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No alternate clinical mapping or validation bypass is exposed to an unadmitted record; callers own prior quaternion admission.
 */
export namespace resolvePreparedChainLower {
  /**
   * Compose a mid frame from two already converted chain articulations.
   * The caller must use the preparation's clinical mapping and keep root,
   * ancestors and intermediate joints unchanged. Missing articulations are
   * identity, as in full FK; no unused clinical basis is admitted here.
   *
   * States admitted-quaternion input, stable prepared dependencies and missing-articulation meaning.
   * Composes prepared root frame, upper articulation, fixed root-to-mid transform and lower articulation in the original two-stage FK order.
   * This prefix owns the rigid compositions for both clinical candidates and an authored-order admission scan, so validation order can change without duplicating FK mathematics.
   * Accepts actual admitted articulations rather than an ideal target; identity applies only to an absent articulation, not an arbitrary clinical zero.
   * Constant quaternion/vector work with no clinical reconversion or skeleton walk; the caller reuses the quaternion work its admission scan already completed.
   * Prepared fixed transforms and the exact completed articulation conversions are reused; changed parent or intermediate inputs require new preparation.
   * Returns one fresh frame, retaining no inputs, cache, handles or tasks after return.
   */
  export function fromRotations(
    prepared: IPreparedChainPlant,
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ): IAutoMovieChainBone {
    const upperRotation: IAutoMovieQuaternion = Quaternion.multiply(
      prepared.upper.worldRotation,
      upper,
    );
    const lowerPosition: IAutoMovieVector3 = Vector3.add(
      prepared.upper.worldPosition,
      Quaternion.rotateVector(upperRotation, prepared.lowerOffset),
    );
    const lowerRotation: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(upperRotation, prepared.lowerRotation),
      lower,
    );
    return { worldPosition: lowerPosition, worldRotation: lowerRotation };
  }
}
