import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieJointRotationDomain } from "../kinematics/IAutoMovieJointRotationDomain";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { hingedArmSpan } from "../kinematics/hingedArmSpan";
import { jointRomOvershoot } from "../kinematics/jointRomOvershoot";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { Quaternion } from "../math/Quaternion";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/getConstraint";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import type { IPreparedChainPlant } from "./IPreparedChainPlant";
import type { prepareChainFit } from "./prepareChainFit";
import { prepareJointRotationProjection } from "./prepareJointRotationProjection";
import { solveDistalTwist } from "./solveDistalTwist";

/**
 * The part of a chain fit's lazy rig that the rig alone fixes: what
 * `prepareChainFitRig` reads of the skeleton, the merged clinical axes, the
 * rest frames and the chain's pose-independent records, and nothing of a
 * source pose, a goal or a target.
 *
 * A fit of one request builds it for itself. A chain's rig constants
 * (`prepareChainConstants`) are built with one, for the clinical tables
 * given there, and a chain placed from those constants (`placeChainPlant`)
 * carries it to its fit, which must pass those same tables.
 *
 * Every member is first computed where its first consumer asks for it, so a
 * rig that refuses an axis or an angle refuses it at that consumer's call,
 * and a refusal is not kept.
 *
 * @param props The rig, the chain and the merged clinical tables, unchanged for the record's life.
 * @param fixed The chain's pose-independent records: its two joints' domains and its fixed lower-to-effector rotation. Null for a chain that could not be prepared, whose domains and effector rest are then read from the skeleton as `prepareChainFitRig` read them.
 * @returns The lazy rig-only members and the hinge span holder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is rig-only, the two owners and their lifetimes, the same-tables premise of a carried record, the lazy first-use admission and the null case.
 * @evidence contracts/development/implementation.md#principled-implementation A bone's record, effective range, normalized basis, clamp, range scorer, the effector's projector coefficients and fixed-rest inverse, the distal-twist effector readings and the hinge's range are functions of the skeleton, the clinical tables and the chain's rest records alone; these are the expressions `prepareChainFitRig` held, moved without change, so a value read here is the value a per-fit rig read.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner holds the rig-only members; `prepareChainFitRig` adds the source pose's and the goal's members over it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No target score, callback result, projected joint, source reading or seed is kept; the defaults, lookup conventions and diagnostic paths are the original ones.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each used bone's record, domain, basis, clamp and scorer is prepared once per record, at most three names; the projector, the fixed-rest inverse, the distal readings, the hinge range and the hinge span are prepared once. Carried by a chain's constants, that is once per rig and chain instead of once per fit; unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A record carried by a chain's constants serves every fit of a chain placed from them. The members are pure functions of the rig, the tables and those constants, and the projector's query scratch is leased per query, so sharing them across fits changes no value; that each fit passes the tables the constants were built with is the premise of whoever places the chain.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owner keeps one record of bounded size: maps of at most the chain's three bones, one projector, a few fixed records and one span holder. It borrows the skeleton and tables and is released with its owner; no pose, target, result or handle is retained.
 */
export function prepareChainRigConstants(
  props: Pick<IFitChainToTargetProps, "skeleton" | "chain" | "jointAxes" | "restFrames">,
  fixed: prepareChainRigConstants.IFixed | null,
): prepareChainRigConstants.IRig {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieBone | undefined> =
    new Map();
  const domains: Map<AutoMovieHumanoidBone, IAutoMovieJointRotationDomain> =
    new Map();
  const bases: Map<IAutoMovieJointAxes, IAutoMovieJointAxes> = new Map();
  const clamps: Map<
    AutoMovieHumanoidBone,
    (joint: IAutoMovieJointPose) => IAutoMovieJointPose
  > = new Map();
  // Each bone's record composer, by the rest frame record it was prepared on.
  const composers: Map<
    AutoMovieHumanoidBone,
    { frame: IAutoMovieRestFrame | undefined; compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> }
  > = new Map();
  const scores: Map<
    AutoMovieHumanoidBone,
    (joint: IAutoMovieJointPose, rotation?: IAutoMovieQuaternion) => number
  > = new Map();
  let project: ReturnType<typeof prepareJointRotationProjection> | undefined;
  let restInverse: IAutoMovieQuaternion | undefined;
  let distal: ReturnType<typeof solveDistalTwist.prepare> | undefined;
  let range: { min: number; max: number } | null | undefined;
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
  const rig: prepareChainRigConstants.IRig = {
    span: hingedArmSpan.empty(),
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
          fixed !== null && bone === props.chain.upper
            ? fixed.upperDomain
            : fixed !== null && bone === props.chain.lower
              ? fixed.lowerDomain
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
    composer: (
      bone: AutoMovieHumanoidBone,
      frame: IAutoMovieRestFrame | undefined,
    ): ReturnType<typeof jointToQuaternionOnBasis.prepare> => {
      let known: { frame: IAutoMovieRestFrame | undefined; compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> } | undefined =
        composers.get(bone);
      if (known === undefined || known.frame !== frame) {
        known = {
          frame,
          compose: jointToQuaternionOnBasis.prepare(rig.jointBasis(bone, "jointToQuaternion axes"), frame),
        };
        composers.set(bone, known);
      }
      return known.compose;
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
    overshoot: (
      bone: AutoMovieHumanoidBone,
    ): ((joint: IAutoMovieJointPose, rotation?: IAutoMovieQuaternion) => number) => {
      let score: ((joint: IAutoMovieJointPose, rotation?: IAutoMovieQuaternion) => number) | undefined =
        scores.get(bone);
      if (score === undefined) {
        score = jointRomOvershoot.prepare(bone, rig.domain(bone).constraint);
        scores.set(bone, score);
      }
      return score;
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
          fixed?.effectorBaseRotation ??
            rig.bone(props.chain.effector)?.rest.rotation ??
            Quaternion.identity(),
        );
      return restInverse;
    },
    distalTwist: (): ReturnType<typeof solveDistalTwist.prepare> => {
      distal ??= solveDistalTwist.prepare({
        effectorRest:
          fixed?.effectorBaseRotation ??
          rig.bone(props.chain.effector)?.rest.rotation ??
          Quaternion.identity(),
        effectorBasis: rig.basis(props.chain.effector, "jointToQuaternion axes"),
        effectorFrame: props.restFrames?.[props.chain.effector],
      });
      return distal;
    },
    hingeRange: (
      read: () => { min: number; max: number } | null,
    ): { min: number; max: number } | null => {
      if (range === undefined) range = read();
      return range;
    },
  };
  return rig;
}

/**
 * The records of {@link prepareChainRigConstants}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each record and member states its content and owner.
 * @evidence contracts/development/design.md#principled-representation The rig-only members are the same lazy readers `prepareChainFit.IRig` declares, picked from it, beside the hinge span holder; a pose, a goal or a target has no member here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainFitRig` reads every member; `prepareChainConstants` builds one record per chain and `placeChainPlant` hands it to the placed chain. `prepareChainFit.IRig` stays the owner of each reader's contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No flag says a record fits a request: a record travels with the constants it was built from, and a chain without one builds its own.
 */
export namespace prepareChainRigConstants {
  /** The pose-independent records of a chain that the readers read: its two joints' domains and its fixed lower-to-effector rotation. */
  export type IFixed = Pick<
    IPreparedChainPlant,
    "upperDomain" | "lowerDomain" | "effectorBaseRotation"
  >;

  /** The rig-only readers of `prepareChainFit.IRig` and the hinge span holder. */
  export interface IRig
    extends Pick<
      prepareChainFit.IRig,
      | "bone"
      | "domain"
      | "basis"
      | "jointBasis"
      | "composer"
      | "clamp"
      | "overshoot"
      | "effectorProjection"
      | "effectorRestInverse"
      | "distalTwist"
      | "hingeRange"
    > {
    /** The hinge's span coefficients, read at the first branch query and shared by every source of this chain's rest records (`hingedArmSwivel.prepare`). */
    span: hingedArmSpan.ISpan;
  }
}
