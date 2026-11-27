import type {
  AutoMovieHumanoidBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointPose,
  IAutoMoviePreparedChainPlant,
  IAutoMoviePrepareChainRigConstants,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../../kinematics/DEFAULT_JOINT_AXES";
import { hingedArmSwivel } from "../../kinematics/hingedArmSwivel";
import { jointToQuaternionOnBasis } from "../../kinematics/internal/jointToQuaternionOnBasis";
import { Quaternion } from "../../math/Quaternion";
import type { prepareChainFit } from "./prepareChainFit";
import { prepareChainRigConstants } from "./prepareChainRigConstants";

/**
 * Own lazy rig preparation for every target of one unchanged source chain. Axes
 * must already use skeleton-declared precedence, and a nonnull geometry must
 * belong to the same source root, ancestors, intermediate pose and rig. Every
 * getter is first called at the consumer's original admission site. A supplied
 * fixed rig belongs to the same immutable source without goal fields; only
 * source methods are borrowed, while reference and weight get a new
 * binding-local owner with their original first-use admission. The members the
 * rig alone fixes are `prepareChainRigConstants`'s: the ones a chain placed
 * from its rig constants carries (`IPreparedChainPlant.rig`), or built here for
 * this source.
 */
export function prepareChainFitRig(
  props: Omit<IAutoMovieFitChainToTargetProps, "target">,
  prepared: IAutoMoviePreparedChainPlant | null,
  fixed?: prepareChainFit.IRig,
): prepareChainFit.IRig {
  const reference: ReturnType<typeof prepareReferences> =
    prepareReferences(props);
  if (fixed !== undefined)
    return {
      ...fixed,
      reference: (bone: AutoMovieHumanoidBone): IAutoMovieQuaternion | null =>
        reference.rotation(bone, fixed),
      referenceWeight: reference.weight,
    };

  // The rig-only members: those the chain's constants carry when it was
  // placed from them, else this source's own.
  const constant: IAutoMoviePrepareChainRigConstants.IRig =
    prepared?.rig ?? prepareChainRigConstants(props, prepared);
  let held: IAutoMovieJointPose | undefined;
  for (const joint of props.pose.joints)
    if (joint.bone === props.chain.effector) held = joint;
  held ??= {
    bone: props.chain.effector,
    flexion: null,
    abduction: null,
    twist: null,
  };
  const heldJoint: IAutoMovieJointPose = held;
  const heldRotation: IAutoMovieQuaternion = Quaternion.multiply(
    prepared?.effectorBaseRotation ??
      constant.bone(props.chain.effector)?.rest.rotation ??
      Quaternion.identity(),
    jointToQuaternionOnBasis.run(
      heldJoint,
      constant.basis(props.chain.effector, "jointToQuaternion axes"),
      props.restFrames?.[props.chain.effector],
    ),
  );
  const heldInverse: IAutoMovieQuaternion = Quaternion.inverse(heldRotation);
  const hingeGeometry: hingedArmSwivel.IPrepared | null =
    prepared === null
      ? null
      : hingedArmSwivel.prepare(
          {
            upper: prepared.upper,
            midOffset: prepared.lowerOffset,
            midRest: prepared.lowerRotation,
            endOffset: prepared.effectorOffset,
            hinge: (props.jointAxes?.[props.chain.lower] ?? DEFAULT_JOINT_AXES)
              .flexion,
          },
          constant.span,
        );
  const rig: prepareChainFit.IRig = {
    bone: constant.bone,
    domain: constant.domain,
    basis: constant.basis,
    jointBasis: constant.jointBasis,
    composer: constant.composer,
    clamp: constant.clamp,
    overshoot: constant.overshoot,
    rotatedOvershoot: constant.rotatedOvershoot,
    effectorProjection: constant.effectorProjection,
    effectorRestInverse: constant.effectorRestInverse,
    distalTwist: constant.distalTwist,
    hingeRange: constant.hingeRange,
    upperRange: constant.upperRange,
    held: (): IAutoMovieJointPose => heldJoint,
    heldRotation: (): IAutoMovieQuaternion => heldRotation,
    heldRotationInverse: (): IAutoMovieQuaternion => heldInverse,
    reference: (bone: AutoMovieHumanoidBone): IAutoMovieQuaternion | null =>
      reference.rotation(bone, rig),
    referenceWeight: reference.weight,
    hingedGeometry: (): hingedArmSwivel.IPrepared | null => hingeGeometry,
  };
  return rig;
}

/**
 * Query-local first-record reference and weight; neither belongs to the fixed
 * source rig.
 */
function prepareReferences(
  props: Omit<IAutoMovieFitChainToTargetProps, "target">,
): {
  rotation: (
    bone: AutoMovieHumanoidBone,
    rig: prepareChainFit.IRig,
  ) => IAutoMovieQuaternion | null;
  weight: () => number;
} {
  const references: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion | null> =
    new Map();
  let weight: number | undefined;
  return {
    rotation: (
      bone: AutoMovieHumanoidBone,
      rig: prepareChainFit.IRig,
    ): IAutoMovieQuaternion | null => {
      let reference: IAutoMovieQuaternion | null | undefined =
        references.get(bone);
      if (reference === undefined) {
        const joint: IAutoMovieJointPose | undefined =
          props.referencePose?.joints.find(
            (candidate: IAutoMovieJointPose): boolean =>
              candidate.bone === bone,
          );
        reference =
          joint === undefined
            ? null
            : Quaternion.normalize(
                jointToQuaternionOnBasis.run(
                  joint,
                  rig.jointBasis(bone, "jointToQuaternion axes"),
                  props.restFrames?.[bone],
                ),
              );
        references.set(bone, reference);
      }
      return reference;
    },
    weight: (): number => {
      if (weight === undefined) {
        const value: number = props.referenceWeight ?? 1;
        if (value < 0)
          throw new Error(
            `fitChainToTarget referenceWeight must be finite and non-negative, but was ${value}`,
          );
        weight = value;
      }
      return weight;
    },
  };
}
