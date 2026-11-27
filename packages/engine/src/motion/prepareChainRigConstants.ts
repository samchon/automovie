import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieJointRotationDomain,
  IAutoMovieJointRotationFrame,
  IAutoMoviePrepareChainRigConstants,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { hingedArmSpan } from "../kinematics/internal/hingedArmSpan";
import { jointRomOvershoot } from "../kinematics/jointRomOvershoot";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { normalizeJointAxes } from "../kinematics/internal/normalizeJointAxes";
import { skeletonJointAxes } from "../kinematics/internal/skeletonJointAxes";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { Quaternion } from "../math/Quaternion";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/internal/getConstraint";
import { scanJointRom } from "../rom/scanJointRom";
import { prepareJointRotationProjection } from "./prepareJointRotationProjection";
import { solveDistalTwist } from "./solveDistalTwist";

/** One chain joint's rig-only members, prepared with the rig. */
interface IJoint {
  /** The joint's bone. */
  bone: AutoMovieHumanoidBone;

  /** The skeleton's record of the bone, when it has one. */
  record: IAutoMovieBone | undefined;

  /** The bone's domain. */
  domain: IAutoMovieJointRotationDomain;

  /** The bone's normalized clinical axes. */
  basis: IAutoMovieJointAxes;

  /** The rest frame its composer was prepared on. */
  frame: IAutoMovieRestFrame | undefined;

  /** The bone's record composer on that frame. */
  compose: ReturnType<typeof jointToQuaternionOnBasis.prepare>;

  /** The bone's ROM clamp. */
  clamp: (joint: IAutoMovieJointPose) => IAutoMovieJointPose;

  /** The bone's ROM overshoot scorer. */
  overshoot: (
    joint: IAutoMovieJointPose,
    rotation?: IAutoMovieQuaternion,
  ) => number;

  /** The bone's rotation-only overshoot scorer, or null. */
  rotatedOvershoot: ((rotation: IAutoMovieQuaternion) => number) | null;
}

/**
 * The part of a chain fit's rig that the rig alone fixes: what
 * `prepareChainFitRig` reads of the skeleton, the merged clinical axes, the
 * rest frames and the chain's pose-independent records, and nothing of a source
 * pose, a goal or a target.
 *
 * A fit of one request builds it for itself. A chain's rig constants
 * (`prepareChainConstants`) are built with one, for the clinical tables given
 * there, and a chain placed from those constants (`placeChainPlant`) carries it
 * to its fit, which must pass those same tables.
 *
 * Every member of the chain's three joints is prepared here; a bone outside the
 * chain is computed directly where it is asked for.
 *
 * @param props The rig, the chain and the merged clinical tables, unchanged for
 *   the record's life.
 * @param fixed The chain's pose-independent records: its two joints' domains
 *   and its fixed lower-to-effector rotation. Null for a chain that could not
 *   be prepared, whose domains and effector rest are then read from the
 *   skeleton as `prepareChainFitRig` read them.
 * @returns The rig-only members and the fixed hinge span.
 */
export function prepareChainRigConstants(
  props: Pick<
    IAutoMovieFitChainToTargetProps,
    "skeleton" | "chain" | "jointAxes" | "restFrames"
  >,
  fixed: prepareChainRigConstants.IFixed | null,
): prepareChainRigConstants.IRig {
  const recordOf = (bone: AutoMovieHumanoidBone): IAutoMovieBone | undefined =>
    props.skeleton.bones.find(
      (candidate: IAutoMovieBone): boolean => candidate.bone === bone,
    );
  const domainOf = (
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieJointRotationDomain =>
    fixed !== null && bone === props.chain.upper
      ? fixed.upperDomain
      : fixed !== null && bone === props.chain.lower
        ? fixed.lowerDomain
        : {
            bone,
            constraint: getConstraint(bone, recordOf(bone)?.constraint ?? null),
          };
  const basisOf = (
    bone: AutoMovieHumanoidBone,
    path: string,
  ): IAutoMovieJointAxes =>
    normalizeJointAxes(props.jointAxes?.[bone] ?? DEFAULT_JOINT_AXES, path);
  const clampAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    skeletonJointAxes(props.skeleton, HUMANOID_JOINT_AXES);

  /** The swing-twist frame of a gated bone, prepared with its region. */
  const rangeOf = (
    bone: AutoMovieHumanoidBone,
    domain: IAutoMovieJointRotationDomain,
    axes: IAutoMovieJointAxes | undefined,
  ): IAutoMovieJointRotationFrame | undefined => {
    const constraint: IAutoMovieJointRotationDomain["constraint"] =
      domain.constraint;
    if (
      constraint === null ||
      constraint.swingTwist === undefined ||
      constraint.swingTwist === null
    )
      return undefined;
    const frame: IAutoMovieJointRotationFrame | undefined =
      swingTwistRange.fromAxes(bone, axes);
    return frame === undefined
      ? undefined
      : swingTwistRange.prepare(bone, frame, constraint);
  };
  const prepareJoint = (bone: AutoMovieHumanoidBone): IJoint => {
    const record: IAutoMovieBone | undefined = recordOf(bone);
    const domain: IAutoMovieJointRotationDomain = domainOf(bone);
    const frame: IAutoMovieRestFrame | undefined = props.restFrames?.[bone];
    return {
      bone,
      record,
      domain,
      basis: basisOf(bone, "jointToQuaternion axes"),
      frame,
      compose: jointToQuaternionOnBasis.prepare(
        basisOf(bone, "jointToQuaternion axes"),
        frame,
      ),
      clamp: clampJointToSkeleton.resolved(
        bone,
        record,
        (): IAutoMovieJointRotationFrame | undefined =>
          rangeOf(bone, domain, clampAxes[bone]),
      ),
      overshoot: jointRomOvershoot.prepare(bone, domain.constraint),
      rotatedOvershoot: scanJointRom.prepareRotated(bone, domain.constraint),
    };
  };
  const joints: IJoint[] = [
    props.chain.upper,
    props.chain.lower,
    props.chain.effector,
  ].map(prepareJoint);
  const jointOf = (bone: AutoMovieHumanoidBone): IJoint =>
    joints.find((candidate: IJoint): boolean => candidate.bone === bone) ??
    prepareJoint(bone);

  const effectorRest: IAutoMovieQuaternion =
    fixed?.effectorBaseRotation ??
    jointOf(props.chain.effector).record?.rest.rotation ??
    Quaternion.identity();
  const effector: IJoint = jointOf(props.chain.effector);
  const project: ReturnType<typeof prepareJointRotationProjection> =
    prepareJointRotationProjection({
      domain: effector.domain,
      basis: effector.basis,
      frame: props.restFrames?.[props.chain.effector],
      clamp: effector.clamp,
    });
  const distal: ReturnType<typeof solveDistalTwist.prepare> =
    solveDistalTwist.prepare({
      effectorRest,
      effectorBasis: effector.basis,
      effectorFrame: props.restFrames?.[props.chain.effector],
    });
  const restInverse: IAutoMovieQuaternion = Quaternion.inverse(effectorRest);
  const upperRange: IAutoMovieJointRotationFrame | undefined = rangeOf(
    props.chain.upper,
    jointOf(props.chain.upper).domain,
    HUMANOID_JOINT_AXES[props.chain.upper],
  );
  const rig: prepareChainRigConstants.IRig = {
    span:
      fixed === null
        ? hingedArmSpan.empty()
        : hingedArmSpan.prepare({
            midOffset: fixed.lowerOffset,
            midRest: fixed.lowerRotation,
            endOffset: fixed.effectorOffset,
            hinge: (props.jointAxes?.[props.chain.lower] ?? DEFAULT_JOINT_AXES)
              .flexion,
          }),
    bone: (bone: AutoMovieHumanoidBone): IAutoMovieBone | undefined =>
      jointOf(bone).record,
    domain: (bone: AutoMovieHumanoidBone): IAutoMovieJointRotationDomain =>
      jointOf(bone).domain,
    basis: (bone: AutoMovieHumanoidBone, path: string): IAutoMovieJointAxes =>
      joints.some((candidate: IJoint): boolean => candidate.bone === bone)
        ? jointOf(bone).basis
        : basisOf(bone, path),
    composer: (
      bone: AutoMovieHumanoidBone,
      frame: IAutoMovieRestFrame | undefined,
    ): ReturnType<typeof jointToQuaternionOnBasis.prepare> => {
      const joint: IJoint = jointOf(bone);
      return joint.frame === frame
        ? joint.compose
        : jointToQuaternionOnBasis.prepare(joint.basis, frame);
    },
    jointBasis: (
      bone: AutoMovieHumanoidBone,
      path: string,
    ): IAutoMovieJointAxes =>
      joints.some((candidate: IJoint): boolean => candidate.bone === bone)
        ? jointOf(bone).basis
        : basisOf(bone, path),
    clamp: (
      bone: AutoMovieHumanoidBone,
    ): ((joint: IAutoMovieJointPose) => IAutoMovieJointPose) =>
      jointOf(bone).clamp,
    overshoot: (
      bone: AutoMovieHumanoidBone,
    ): ((
      joint: IAutoMovieJointPose,
      rotation?: IAutoMovieQuaternion,
    ) => number) => jointOf(bone).overshoot,
    rotatedOvershoot: (
      bone: AutoMovieHumanoidBone,
    ): ((rotation: IAutoMovieQuaternion) => number) | null =>
      jointOf(bone).rotatedOvershoot,
    effectorProjection: (): ReturnType<typeof prepareJointRotationProjection> =>
      project,
    effectorRestInverse: (): IAutoMovieQuaternion => restInverse,
    distalTwist: (): ReturnType<typeof solveDistalTwist.prepare> => distal,
    hingeRange: (
      read: () => { min: number; max: number } | null,
    ): { min: number; max: number } | null => read(),
    upperRange,
  };
  return rig;
}

/** The records of {@link prepareChainRigConstants}. */
export namespace prepareChainRigConstants {
  /**
   * The pose-independent records of a chain that the readers read: its two
   * joints' domains and its fixed lower-to-effector rotation.
   */
  export type IFixed = Pick<
    IAutoMoviePreparedChainPlant,
    | "upperDomain"
    | "lowerDomain"
    | "effectorBaseRotation"
    | "lowerOffset"
    | "lowerRotation"
    | "effectorOffset"
  >;

  /** The interface contract (`IAutoMoviePrepareChainRigConstants.IRig`). */
  export type IRig = IAutoMoviePrepareChainRigConstants.IRig;
}
