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
import { hingedArmSpan } from "../kinematics/hingedArmSpan";
import { jointRomOvershoot } from "../kinematics/jointRomOvershoot";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { Quaternion } from "../math/Quaternion";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/getConstraint";
import { scanJointRom } from "../rom/scanJointRom";
import { prepareJointRotationProjection } from "./prepareJointRotationProjection";
import { solveDistalTwist } from "./solveDistalTwist";

/**
 * The part of a chain fit's lazy rig that the rig alone fixes: what
 * `prepareChainFitRig` reads of the skeleton, the merged clinical axes, the
 * rest frames and the chain's pose-independent records, and nothing of a source
 * pose, a goal or a target.
 *
 * A fit of one request builds it for itself. A chain's rig constants
 * (`prepareChainConstants`) are built with one, for the clinical tables given
 * there, and a chain placed from those constants (`placeChainPlant`) carries it
 * to its fit, which must pass those same tables.
 *
 * Every member is first computed where its first consumer asks for it, so a rig
 * that refuses an axis or an angle refuses it at that consumer's call, and a
 * refusal is not kept.
 *
 * @param props The rig, the chain and the merged clinical tables, unchanged for
 *   the record's life.
 * @param fixed The chain's pose-independent records: its two joints' domains
 *   and its fixed lower-to-effector rotation. Null for a chain that could not
 *   be prepared, whose domains and effector rest are then read from the
 *   skeleton as `prepareChainFitRig` read them.
 * @returns The lazy rig-only members and the hinge span holder.
 */
export function prepareChainRigConstants(
  props: Pick<
    IAutoMovieFitChainToTargetProps,
    "skeleton" | "chain" | "jointAxes" | "restFrames"
  >,
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
    {
      frame: IAutoMovieRestFrame | undefined;
      compose: ReturnType<typeof jointToQuaternionOnBasis.prepare>;
    }
  > = new Map();
  const scores: Map<
    AutoMovieHumanoidBone,
    (joint: IAutoMovieJointPose, rotation?: IAutoMovieQuaternion) => number
  > = new Map();
  const rotatedScores: Map<
    AutoMovieHumanoidBone,
    ((rotation: IAutoMovieQuaternion) => number) | null
  > = new Map();
  let project: ReturnType<typeof prepareJointRotationProjection> | undefined;
  let restInverse: IAutoMovieQuaternion | undefined;
  let distal: ReturnType<typeof solveDistalTwist.prepare> | undefined;
  let range: { min: number; max: number } | null | undefined;

  // The upper joint's frame under its swing-twist gate, with its swing region
  // built here, once for every solve of this chain.
  const upperConstraint: IAutoMovieJointRotationDomain["constraint"] =
    fixed !== null
      ? fixed.upperDomain.constraint
      : getConstraint(
          props.chain.upper,
          props.skeleton.bones.find(
            (candidate: IAutoMovieBone): boolean =>
              candidate.bone === props.chain.upper,
          )?.constraint ?? null,
        );
  const upperFrame: IAutoMovieJointRotationFrame | undefined =
    upperConstraint === null ||
    upperConstraint.swingTwist === undefined ||
    upperConstraint.swingTwist === null
      ? undefined
      : swingTwistRange.of(props.chain.upper);
  const upperRange: IAutoMovieJointRotationFrame | undefined =
    upperFrame === undefined || upperConstraint === null
      ? undefined
      : swingTwistRange.prepare(upperFrame, upperConstraint);
  let clampAxes:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    | undefined;

  /**
   * Cache only successful admission of the actual selected axes; strict and
   * lenient defaults select their own records.
   */
  const readBasis: (
    axes: IAutoMovieJointAxes,
    path: string,
  ) => IAutoMovieJointAxes = (
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
      let known:
        | {
            frame: IAutoMovieRestFrame | undefined;
            compose: ReturnType<typeof jointToQuaternionOnBasis.prepare>;
          }
        | undefined = composers.get(bone);
      if (known === undefined || known.frame !== frame) {
        known = {
          frame,
          compose: jointToQuaternionOnBasis.prepare(
            rig.jointBasis(bone, "jointToQuaternion axes"),
            frame,
          ),
        };
        composers.set(bone, known);
      }
      return known.compose;
    },
    jointBasis: (
      bone: AutoMovieHumanoidBone,
      path: string,
    ): IAutoMovieJointAxes => {
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
          (): IAutoMovieJointRotationFrame | undefined => {
            const constraint: IAutoMovieJointRotationDomain["constraint"] =
              rig.domain(bone).constraint;
            if (
              constraint === null ||
              constraint.swingTwist === undefined ||
              constraint.swingTwist === null
            )
              return undefined;
            clampAxes ??= skeletonJointAxes(
              props.skeleton,
              HUMANOID_JOINT_AXES,
            );
            return swingTwistRange.fromAxes(bone, clampAxes[bone]);
          },
        );
        clamps.set(bone, clamp);
      }
      return clamp;
    },
    overshoot: (
      bone: AutoMovieHumanoidBone,
    ): ((
      joint: IAutoMovieJointPose,
      rotation?: IAutoMovieQuaternion,
    ) => number) => {
      let score:
        | ((
            joint: IAutoMovieJointPose,
            rotation?: IAutoMovieQuaternion,
          ) => number)
        | undefined = scores.get(bone);
      if (score === undefined) {
        score = jointRomOvershoot.prepare(bone, rig.domain(bone).constraint);
        scores.set(bone, score);
      }
      return score;
    },
    rotatedOvershoot: (
      bone: AutoMovieHumanoidBone,
    ): ((rotation: IAutoMovieQuaternion) => number) | null => {
      let score:
        | ((rotation: IAutoMovieQuaternion) => number)
        | null
        | undefined = rotatedScores.get(bone);
      if (score === undefined) {
        score = scanJointRom.prepareRotated(bone, rig.domain(bone).constraint);
        rotatedScores.set(bone, score);
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
        effectorBasis: rig.basis(
          props.chain.effector,
          "jointToQuaternion axes",
        ),
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
    "upperDomain" | "lowerDomain" | "effectorBaseRotation"
  >;

  /** The interface contract (`IAutoMoviePrepareChainRigConstants.IRig`). */
  export type IRig = IAutoMoviePrepareChainRigConstants.IRig;
}
