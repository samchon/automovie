import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieJointRotationDomain } from "../kinematics/IAutoMovieJointRotationDomain";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { Quaternion } from "../math/Quaternion";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/getConstraint";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import type { IPreparedChainPlant } from "./IPreparedChainPlant";
import type { prepareChainFit } from "./prepareChainFit";
import { prepareJointRotationProjection } from "./prepareJointRotationProjection";
import { solveDistalTwist } from "./solveDistalTwist";

/**
 * Own lazy rig preparation for every target of one unchanged source chain.
 * Axes must already use skeleton-declared precedence, and a nonnull geometry
 * must belong to the same source root, ancestors, intermediate pose and rig.
 * Every getter is first called at the consumer's original admission site.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States merged-axis and matching-geometry premises, lazy admission, source-only reuse and the owning workspace lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Fixed rig and source data determine effective ROM, normalized bases, clamps, projector coefficients, fixed-rest inverse and reference/hinge readings independently of target; getters preserve original defaults, lookup conventions and diagnostic paths.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner holds only rig/source preparation; prepareChainFit owns FK/continuity and target consumers own analytic solving, projection queries and candidate ranking.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No target score, user callback result, projected joint or continuation seed is cached. Hinged references retain first-record lookup and held source effectors retain last-record lookup; changed dependencies require another workspace.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each used chain bone's metadata/domain/basis/clamp is prepared once, at most three names. Only actual swing-twist clamps share one lazy canonical-family axes merge; box/cone clamps skip unused frames. Held/reference scans are O(J) once; raw held/inverse, fixed effector terms, projector and hinge data are fixed-size lazy preparations. Every target query still runs; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged source/rig/mappings prove equivalence across targets. basis retains basisOf/orientation's nullish default, jointBasis retains direct conversion's undefined-only default, and actual selected-axis keys prevent one from masking the other's failure. Clamps use canonical HUMANOID axes after their constraint gate; held products, domains and pure hinge reads retain grouping and first-use admission, with no failed preparation stored.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller's workspace owns maps for used chain identities, fixed coefficients and source/reference values until release. Inputs are borrowed, loader callbacks and target results are not retained, and no global collection, handle or task owns this context.
 */
export function prepareChainFitRig(
  props: Omit<IFitChainToTargetProps, "target">,
  prepared: IPreparedChainPlant | null,
): prepareChainFit.IRig {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieBone | undefined> =
    new Map();
  const domains: Map<AutoMovieHumanoidBone, IAutoMovieJointRotationDomain> =
    new Map();
  const bases: Map<IAutoMovieJointAxes, IAutoMovieJointAxes> = new Map();
  const clamps: Map<
    AutoMovieHumanoidBone,
    (joint: IAutoMovieJointPose) => IAutoMovieJointPose
  > = new Map();
  const references: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion | null> =
    new Map();
  let project: ReturnType<typeof prepareJointRotationProjection> | undefined;
  let restInverse: IAutoMovieQuaternion | undefined;
  let held: IAutoMovieJointPose | undefined;
  let heldRotation: IAutoMovieQuaternion | undefined;
  let heldInverse: IAutoMovieQuaternion | undefined;
  let distal: ReturnType<typeof solveDistalTwist.prepare> | undefined;
  let weight: number | undefined;
  let range: { min: number; max: number } | null | undefined;
  let swing: IAutoMovieVector3 | undefined;
  let clampAxes:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    | undefined;

  /** Cache only successful admission of the actual selected axes; strict and lenient defaults select their own records. */
  const readBasis: (axes: IAutoMovieJointAxes, path: string) => IAutoMovieJointAxes = (
    axes: IAutoMovieJointAxes,
    path: string,
  ): IAutoMovieJointAxes => {
    let basis: IAutoMovieJointAxes | undefined = bases.get(axes);
    if (basis === undefined) {
      basis = normalizeJointAxes(axes, path);
      bases.set(axes, basis);
    }
    return basis;
  };
  const rig: prepareChainFit.IRig = {
    bone: (bone: AutoMovieHumanoidBone): IAutoMovieBone | undefined => {
      if (!bones.has(bone))
        bones.set(
          bone,
          props.skeleton.bones.find(
            (candidate: IAutoMovieBone): boolean => candidate.bone === bone,
          ),
        );
      return bones.get(bone);
    },
    domain: (bone: AutoMovieHumanoidBone): IAutoMovieJointRotationDomain => {
      let domain: IAutoMovieJointRotationDomain | undefined = domains.get(bone);
      if (domain === undefined) {
        domain =
          prepared !== null && bone === props.chain.upper
            ? prepared.upperDomain
            : prepared !== null && bone === props.chain.lower
              ? prepared.lowerDomain
              : {
                  bone,
                  constraint: getConstraint(
                    bone,
                    rig.bone(bone)?.constraint ?? null,
                  ),
                };
        domains.set(bone, domain);
      }
      return domain;
    },
    basis: (bone: AutoMovieHumanoidBone, path: string): IAutoMovieJointAxes => {
      return readBasis(props.jointAxes?.[bone] ?? DEFAULT_JOINT_AXES, path);
    },
    jointBasis: (bone: AutoMovieHumanoidBone, path: string): IAutoMovieJointAxes => {
      const axes: IAutoMovieJointAxes | undefined = props.jointAxes?.[bone];
      return readBasis(axes === undefined ? DEFAULT_JOINT_AXES : axes, path);
    },
    clamp: (
      bone: AutoMovieHumanoidBone,
    ): ((joint: IAutoMovieJointPose) => IAutoMovieJointPose) => {
      let clamp:
        | ((joint: IAutoMovieJointPose) => IAutoMovieJointPose)
        | undefined = clamps.get(bone);
      if (clamp === undefined) {
        clamp = clampJointToSkeleton.resolved(
          bone,
          rig.bone(bone),
          (): swingTwistRange.IJoint | undefined => {
            const constraint: IAutoMovieJointRotationDomain["constraint"] =
              rig.domain(bone).constraint;
            if (
              constraint === null ||
              constraint.swingTwist === undefined ||
              constraint.swingTwist === null
            )
              return undefined;
            clampAxes ??= skeletonJointAxes(props.skeleton, HUMANOID_JOINT_AXES);
            return swingTwistRange.fromAxes(bone, clampAxes[bone]);
          },
        );
        clamps.set(bone, clamp);
      }
      return clamp;
    },
    effectorProjection: (): ReturnType<
      typeof prepareJointRotationProjection
    > => {
      if (project === undefined)
        project = prepareJointRotationProjection({
          domain: rig.domain(props.chain.effector),
          basis: rig.basis(props.chain.effector, "jointToQuaternion axes"),
          frame: props.restFrames?.[props.chain.effector],
          clamp: rig.clamp(props.chain.effector),
        });
      return project;
    },
    effectorRestInverse: (): IAutoMovieQuaternion => {
      if (restInverse === undefined)
        restInverse = Quaternion.inverse(
          prepared?.effectorBaseRotation ??
            rig.bone(props.chain.effector)?.rest.rotation ??
            Quaternion.identity(),
        );
      return restInverse;
    },
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
    distalTwist: (): ReturnType<typeof solveDistalTwist.prepare> => {
      distal ??= solveDistalTwist.prepare({
        effectorRest:
          prepared?.effectorBaseRotation ??
          rig.bone(props.chain.effector)?.rest.rotation ??
          Quaternion.identity(),
        effectorBasis: rig.basis(props.chain.effector, "jointToQuaternion axes"),
        effectorFrame: props.restFrames?.[props.chain.effector],
      });
      return distal;
    },
    reference: (bone: AutoMovieHumanoidBone): IAutoMovieQuaternion | null => {
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
                jointToQuaternionOnBasis(
                  joint,
                  rig.jointBasis(bone, "jointToQuaternion axes"),
                  props.restFrames?.[bone],
                ),
              );
        references.set(bone, reference);
      }
      return reference;
    },
    referenceWeight: (): number => {
      if (weight === undefined) {
        const value: number = props.referenceWeight ?? 1;
        if (!Number.isFinite(value) || value < 0)
          throw new Error(
            `fitChainToTarget referenceWeight must be finite and non-negative, but was ${value}`,
          );
        weight = value;
      }
      return weight;
    },
    hingeRange: (
      read: () => { min: number; max: number } | null,
    ): { min: number; max: number } | null => {
      if (range === undefined) range = read();
      return range;
    },
    posedSwing: (read: () => IAutoMovieVector3): IAutoMovieVector3 => {
      if (swing === undefined) swing = read();
      return swing;
    },
  };
  return rig;
}
