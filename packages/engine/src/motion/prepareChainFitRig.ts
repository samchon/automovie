import type {
  AutoMovieHumanoidBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointPose,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import type { prepareChainFit } from "./prepareChainFit";
import { prepareChainRigConstants } from "./prepareChainRigConstants";

/**
 * Own lazy rig preparation for every target of one unchanged source chain.
 * Axes must already use skeleton-declared precedence, and a nonnull geometry
 * must belong to the same source root, ancestors, intermediate pose and rig.
 * Every getter is first called at the consumer's original admission site.
 * A supplied fixed rig belongs to the same immutable source without goal
 * fields; only source methods are borrowed, while reference and weight get
 * a new binding-local owner with their original first-use admission.
 * The members the rig alone fixes are `prepareChainRigConstants`'s: the
 * ones a chain placed from its rig constants carries
 * (`IPreparedChainPlant.rig`), or built here for this source.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States merged-axis and matching-geometry premises, lazy admission, source-only reuse, the lent rig-only record and the owning workspace lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Fixed rig and source data determine effective ROM, normalized bases, clamps, projector coefficients, fixed-rest inverse and reference/hinge readings independently of target; getters preserve original defaults, lookup conventions and diagnostic paths.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure prepareChainRigConstants owns the rig-only members; this owner adds the source pose's held effector, posed swing and hinge geometry and the goal's reference and weight. prepareChainFit owns FK/continuity and target consumers own analytic solving, projection queries and candidate ranking.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No target score, user callback result, projected joint or continuation seed is cached. Hinged references retain first-record lookup and held source effectors retain last-record lookup; changed dependencies require another workspace. A chain's carried readers are its constants' own, built with them for the tables its fits pass; that premise is the owner's who places the chain.
 * @evidence contracts/development/implementation.md#efficient-algorithms Held/reference scans are O(J) once; the hinge source inverse is a lazy constant-size preparation. The rig-only members cost what prepareChainRigConstants states, once per workspace or, carried by the chain's constants, once per those constants. Every target query still runs; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged source/rig/mappings prove equivalence across targets and goal bindings. A supplied fixed source rig shares every source-only method, but each binding creates fresh first-record reference and weight readers using that same admitted joint basis. A chain's carried rig-only record shares pure functions of the rig and of the constants the chain was placed from; held products, inverses and hinge geometry keep their original grouping and lazy sites, and changing goals own every query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller's workspace owns source/reference values and, when the chain carries none, the rig-only record until release. Inputs are borrowed, loader callbacks and target results are not retained, and no global collection, handle or task owns this context.
 */
export function prepareChainFitRig(
  props: Omit<IAutoMovieFitChainToTargetProps, "target">,
  prepared: IAutoMoviePreparedChainPlant | null,
  fixed?: prepareChainFit.IRig,
): prepareChainFit.IRig {
  const reference: ReturnType<typeof prepareReferences> = prepareReferences(props);
  if (fixed !== undefined) return {
    ...fixed,
    reference: (bone: AutoMovieHumanoidBone): IAutoMovieQuaternion | null =>
      reference.rotation(bone, fixed),
    referenceWeight: reference.weight,
  };

  // The rig-only members: those the chain's constants carry when it was
  // placed from them, else this source's own.
  const constant: prepareChainRigConstants.IRig =
    prepared?.rig ?? prepareChainRigConstants(props, prepared);
  let held: IAutoMovieJointPose | undefined;
  let heldRotation: IAutoMovieQuaternion | undefined;
  let heldInverse: IAutoMovieQuaternion | undefined;
  let swing: IAutoMovieVector3 | undefined;
  let hingeGeometry: hingedArmSwivel.IPrepared | undefined;
  const rig: prepareChainFit.IRig = {
    bone: constant.bone,
    domain: constant.domain,
    basis: constant.basis,
    jointBasis: constant.jointBasis,
    clamp: constant.clamp,
    overshoot: constant.overshoot,
    effectorProjection: constant.effectorProjection,
    effectorRestInverse: constant.effectorRestInverse,
    distalTwist: constant.distalTwist,
    hingeRange: constant.hingeRange,
    held: (): IAutoMovieJointPose => {
      if (held === undefined) {
        for (const joint of props.pose.joints)
          if (joint.bone === props.chain.effector) held = joint;
        held ??= {
          bone: props.chain.effector,
          flexion: null,
          abduction: null,
          twist: null,
        };
      }
      return held;
    },
    heldRotation: (): IAutoMovieQuaternion => {
      if (heldRotation === undefined)
        heldRotation = Quaternion.multiply(
          prepared?.effectorBaseRotation ??
            rig.bone(props.chain.effector)?.rest.rotation ??
            Quaternion.identity(),
          jointToQuaternionOnBasis(
            rig.held(),
            rig.basis(props.chain.effector, "jointToQuaternion axes"),
            props.restFrames?.[props.chain.effector],
          ),
        );
      return heldRotation;
    },
    heldRotationInverse: (): IAutoMovieQuaternion => {
      heldInverse ??= Quaternion.inverse(rig.heldRotation());
      return heldInverse;
    },
    reference: (bone: AutoMovieHumanoidBone): IAutoMovieQuaternion | null =>
      reference.rotation(bone, rig),
    referenceWeight: reference.weight,
    posedSwing: (read: () => IAutoMovieVector3): IAutoMovieVector3 => {
      if (swing === undefined) swing = read();
      return swing;
    },
    hingedGeometry: (): hingedArmSwivel.IPrepared | null => {
      if (prepared === null) return null;
      hingeGeometry ??= hingedArmSwivel.prepare({
        upper: prepared.upper,
        midOffset: prepared.lowerOffset,
        midRest: prepared.lowerRotation,
        endOffset: prepared.effectorOffset,
        hinge: (props.jointAxes?.[props.chain.lower] ?? DEFAULT_JOINT_AXES).flexion,
      }, constant.span);
      return hingeGeometry;
    },
  };
  return rig;
}

/** Query-local first-record reference and weight; neither belongs to the fixed source rig. */
function prepareReferences(props: Omit<IAutoMovieFitChainToTargetProps, "target">): {
  rotation: (bone: AutoMovieHumanoidBone, rig: prepareChainFit.IRig) => IAutoMovieQuaternion | null;
  weight: () => number;
} {
  const references: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion | null> = new Map();
  let weight: number | undefined;
  return {
    rotation: (bone: AutoMovieHumanoidBone, rig: prepareChainFit.IRig): IAutoMovieQuaternion | null => {
      let reference: IAutoMovieQuaternion | null | undefined = references.get(bone);
      if (reference === undefined) {
        const joint: IAutoMovieJointPose | undefined = props.referencePose?.joints.find(
          (candidate: IAutoMovieJointPose): boolean => candidate.bone === bone,
        );
        reference = joint === undefined ? null : Quaternion.normalize(
          jointToQuaternionOnBasis(joint,
            rig.jointBasis(bone, "jointToQuaternion axes"), props.restFrames?.[bone]),
        );
        references.set(bone, reference);
      }
      return reference;
    },
    weight: (): number => {
      if (weight === undefined) {
        const value: number = props.referenceWeight ?? 1;
        if (!Number.isFinite(value) || value < 0)
          throw new Error(`fitChainToTarget referenceWeight must be finite and non-negative, but was ${value}`);
        weight = value;
      }
      return weight;
    },
  };
}
