import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieJointRotationDomain } from "../kinematics/IAutoMovieJointRotationDomain";
import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import type { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { preparePoseResolution } from "../kinematics/preparePoseResolution";
import type { prepareSkeletonPoseResolution } from "../kinematics/prepareSkeletonPoseResolution";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { twoBoneChainArticulation } from "../kinematics/twoBoneChainArticulation";
import { Quaternion } from "../math/Quaternion";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import type { IPreparedChainPlant } from "./IPreparedChainPlant";
import { prepareChainFitRig } from "./prepareChainFitRig";
import { prepareChainPlant } from "./prepareChainPlant";
import type { prepareJointRotationProjection } from "./prepareJointRotationProjection";
import { resolveBoneMap } from "./resolveBoneMap";
import type { solveDistalTwist } from "./solveDistalTwist";

/**
 * Prepare the unchanged dependencies of several target fits for one chain.
 * The caller owns the lifetime and keeps the rig, source/reference poses,
 * topology, clinical tables and callbacks unchanged until the fits finish.
 * An optional authored reader must include this chain's effector FK from the
 * exact source pose and rig/mappings; callers may include other frames they
 * need. Every source joint must still receive ordered admission. The reader
 * is invoked only at the original lazy authored-FK site.
 * A supplied resolution reader is owned by this same synchronous operation,
 * allowing source, zeroed and reference FK to share exact completed math.
 * A supplied poseResolution must be the immutable snapshot of this exact rig,
 * topology and clinical tables. It computes only the chain's demanded frames;
 * omission retains the raw full-FK admission path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the borrowed inputs, caller-owned lifetime and laziness that preserves degenerate-target admission order.
 * @evidence contracts/development/implementation.md#principled-implementation Separates target-independent FK/domains and last-record joint maps from target-specific analytic solving, using the same skeleton axis precedence and resolveBoneMap as the one-shot fit.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure prepareChainFitRig owns lazy rig/source preparation, while this workspace owns FK and continuity readers; fitChainBend remains the sole owner of target search and ranking.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No search, tolerance, seed, callback result or constraint is approximated; lazy authored/reference reads retain the original order in which a degenerate analytic solve returns without reading them.
 * @evidence contracts/development/implementation.md#efficient-algorithms One geometry/domain preparation and at most one authored/reference-mid FK serve every target. Explicit preparation reuses the immutable merged raw-axis table without another B-bone scan and reads only zeroed chain ancestry, authored effector and reference lower. Raw omission preserves full scans; both retain ordered joint admission and every search/projection. Runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only fixed source dependencies are shared. An explicit immutable poseResolution must match this exact rig/topology/mappings; otherwise raw full FK remains. Rig getters retain original diagnostic sites and hinged first-reference versus free-bend last-reference semantics. Changed rig, pose, frame, callback or reference inputs require another workspace.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One workspace owns O(J+B) local maps/FK dependency snapshots and constant-size data for three chain bones, projector and fixed hinge/reference reads. It borrows fixed inputs and an optional same-operation reader until caller release and retains no target history, global cache, handle or task.
 */
export function prepareChainFit(
  source: Omit<IFitChainToTargetProps, "target">,
  readAuthored?: () => ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieResolvedBone
  >,
  resolution: ReturnType<typeof preparePoseResolution> = preparePoseResolution(),
  poseResolution?: prepareSkeletonPoseResolution.IRig,
): prepareChainFit.IWorkspace {
  const props: Omit<IFitChainToTargetProps, "target"> = {
    ...source,
    jointAxes: poseResolution?.jointAxes ??
      skeletonJointAxes(source.skeleton, source.jointAxes),
  };
  const prepared: IPreparedChainPlant | null = prepareChainPlant(
    props,
    resolution,
    poseResolution,
  );
  const rig: prepareChainFit.IRig = prepareChainFitRig(props, prepared);
  let reading: prepareChainFit.IReading | undefined;
  let referenceLower: IAutoMovieResolvedBone | undefined;
  let articulation:
    | ReturnType<typeof twoBoneChainArticulation.prepare>
    | undefined;
  let authoredContinuity: number | undefined;
  let retainedJoints: readonly IAutoMovieJointPose[] | undefined;
  const prior: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion> = new Map();
  const workspace: prepareChainFit.IWorkspace = {
    props,
    prepared,
    rig,
    articulation: (): ReturnType<typeof twoBoneChainArticulation.prepare> => {
      if (articulation === undefined)
        articulation =
          prepared === null
            ? null
            : twoBoneChainArticulation.prepare({
                upper: prepared.upper,
                lower: prepared.lower,
                end: prepared.end,
              });
      return articulation;
    },
    pose: (
      upper: IAutoMovieJointPose,
      lower: IAutoMovieJointPose,
    ): IAutoMoviePose => {
      retainedJoints ??= props.pose.joints.filter(
        (joint: IAutoMovieJointPose): boolean =>
          joint.bone !== props.chain.upper && joint.bone !== props.chain.lower,
      );
      return { ...props.pose, joints: [...retainedJoints, upper, lower] };
    },
    clamp: (joint: IAutoMovieJointPose): IAutoMovieJointPose =>
      rig.clamp(joint.bone)(joint),
    continuity: (
      bone: AutoMovieHumanoidBone,
      rotation: IAutoMovieQuaternion,
    ): number => {
      const candidate: IAutoMovieQuaternion = Quaternion.normalize(rotation);
      let reference: IAutoMovieQuaternion | undefined = prior.get(bone);
      if (reference === undefined) {
        reference = Quaternion.normalize(
          jointToQuaternionOnBasis(
            workspace.read().referenceAngles.get(bone) ?? {
              bone,
              flexion: null,
              abduction: null,
              twist: null,
            },
            rig.jointBasis(bone, "jointToQuaternion axes"),
            props.restFrames?.[bone],
          ),
        );
        prior.set(bone, reference);
      }
      const angle: number = Quaternion.angle(candidate, reference);
      return angle * angle;
    },
    authoredContinuity: (): number => {
      if (authoredContinuity !== undefined) return authoredContinuity;
      const angles: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose> =
        workspace.read().authoredAngles;
      const distance: (bone: AutoMovieHumanoidBone) => number = (
        bone: AutoMovieHumanoidBone,
      ): number =>
        workspace.continuity(
          bone,
          jointToQuaternionOnBasis(
            angles.get(bone) ?? {
              bone,
              flexion: null,
              abduction: null,
              twist: null,
            },
            rig.jointBasis(bone, "jointToQuaternion axes"),
            props.restFrames?.[bone],
          ),
        );
      authoredContinuity =
        distance(props.chain.upper) + distance(props.chain.lower);
      return authoredContinuity;
    },
    read: (): prepareChainFit.IReading => {
      if (reading !== undefined) return reading;
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        readAuthored === undefined
          ? readBones(props.pose, new Set([props.chain.effector]))
          : readAuthored();
      const authoredAngles: ReadonlyMap<
        AutoMovieHumanoidBone,
        IAutoMovieJointPose
      > = indexJoints(props.pose.joints);
      const referencePose: typeof props.pose =
        props.referencePose ?? props.pose;
      reading = {
        authored: bones.get(props.chain.effector)!.worldPosition,
        authoredAngles,
        referenceAngles:
          referencePose === props.pose
            ? authoredAngles
            : indexJoints(referencePose.joints),
      };
      return reading;
    },
    referenceLower: (): IAutoMovieResolvedBone => {
      if (referenceLower !== undefined) return referenceLower;
      const referenceAngles: ReadonlyMap<
        AutoMovieHumanoidBone,
        IAutoMovieJointPose
      > = workspace.read().referenceAngles;
      const referenceJoints: IAutoMovieJointPose[] = [
        props.chain.upper,
        props.chain.lower,
      ].map(
        (bone: AutoMovieHumanoidBone): IAutoMovieJointPose =>
          referenceAngles.get(bone) ?? {
            bone,
            flexion: null,
            abduction: null,
            twist: null,
          },
      );
      referenceLower = readBones(
        workspace.pose(referenceJoints[0]!, referenceJoints[1]!),
        new Set([props.chain.lower]),
      ).get(props.chain.lower)!;
      return referenceLower;
    },
  };
  return workspace;

  /** Preserve raw FK admission unless the caller supplies its genuine immutable rig. */
  function readBones(
    pose: IAutoMoviePose,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    if (poseResolution === undefined)
      return resolveBoneMap(props.skeleton, pose, props.topology,
        props.jointAxes, props.restFrames, resolution);
    const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
    for (const bone of poseResolution.resolve(pose, resolution, requested))
      map.set(bone.bone, bone);
    return map;
  }
}

/** Index borrowed source/reference records without new admission; later duplicates replace earlier ones without copying joints. */
function indexJoints(
  joints: readonly IAutoMovieJointPose[],
): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose> {
  const indexed: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map();
  for (const joint of joints) indexed.set(joint.bone, joint);
  return indexed;
}

/**
 * Internal source records and lazy rig data for one unchanged fit operation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the source FK readings, fixed rig getters and owning fit workspace, including their unchanged-input lifetime.
 * @evidence contracts/development/design.md#principled-representation Separates lazy source/reference FK and rig preparation from each target's independent search, with the original first-reference and last-authored record conventions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the preparation producer, bend search and prepared-frame consumers use these internal records and readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores no target score, projected answer, cross-call body cache or alternate motion constraint; changed inputs require a new workspace.
 */
export namespace prepareChainFit {
  /** Actual model-metre FK and last-record joint maps, read after analytic target admission. */
  export interface IReading {
    /** Source effector position in resolved model metres. */
    authored: IAutoMovieVector3;

    /** Last source articulation for each bone, borrowed from the input pose. */
    authoredAngles: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose>;

    /** Last reference articulation, or source articulation when no reference was supplied. */
    referenceAngles: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose>;
  }

  /** Lazy immutable-rig preparation; loaders are the existing pure hinge functions, not target scores or user callbacks. */
  export interface IRig {
    /** Exact gate overshoot scorer for this bone's fixed domain under the original canonical scoring frame. */
    overshoot(bone: AutoMovieHumanoidBone): (joint: IAutoMovieJointPose) => number;
    /** Actual skeleton record; an absent bone is remembered too. */
    bone(bone: AutoMovieHumanoidBone): IAutoMovieBone | undefined;

    /** Effective ROM, sharing the geometry's already prepared upper/lower domains. */
    domain(bone: AutoMovieHumanoidBone): IAutoMovieJointRotationDomain;

    /** Existing basisOf/orientation nullish default at the original diagnostic path; failures are not cached. */
    basis(bone: AutoMovieHumanoidBone, path: string): IAutoMovieJointAxes;

    /** Direct clinical conversion's undefined-only default; runtime null must still fail even after a lenient default read. */
    jointBasis(bone: AutoMovieHumanoidBone, path: string): IAutoMovieJointAxes;

    /** Resolve the actual rig clamp once, while every candidate is still clamped. */
    clamp(
      bone: AutoMovieHumanoidBone,
    ): (joint: IAutoMovieJointPose) => IAutoMovieJointPose;

    /** Fixed effector coefficients; every query retains its own Euler reference and returned joint. */
    effectorProjection(): ReturnType<typeof prepareJointRotationProjection>;

    /** Inverse of the unchanged fixed lower-to-effector frame. */
    effectorRestInverse(): IAutoMovieQuaternion;

    /** Last original source end record, or null angles; this never forces authored FK. */
    held(): IAutoMovieJointPose;

    /** Raw fixed effector frame times its last source articulation; borrowed and independent of targets. */
    heldRotation(): IAutoMovieQuaternion;

    /** Inverse of that same raw source-held rotation, read lazily after its original articulation admission. */
    heldRotationInverse(): IAutoMovieQuaternion;

    /** Lazy fixed effector-axis and clinical-zero preparation, independent of all twist targets and candidates. */
    distalTwist(): ReturnType<typeof solveDistalTwist.prepare>;

    /** Hinged scoring's first reference record, distinct from free-bend/FK last-record semantics. */
    reference(bone: AutoMovieHumanoidBone): IAutoMovieQuaternion | null;

    /** Admit the fixed non-negative weight at its original first-use point. */
    referenceWeight(): number;

    /** Original target-independent pure hinge range, including a cached null result. */
    hingeRange(
      read: () => { min: number; max: number } | null,
    ): { min: number; max: number } | null;

    /** Original no-hint source-hinge displacement, read only at that branch's first use. */
    posedSwing(read: () => IAutoMovieVector3): IAutoMovieVector3;

    /** Lazy hinge-span/source-frame geometry; null only when chain preparation failed. */
    hingedGeometry(): hingedArmSwivel.IPrepared | null;
  }

  /** Fixed source request and lazy readings; callers keep all dependencies unchanged until release. */
  export interface IWorkspace {
    /** Fixed source request with actual skeleton-declared axes taking precedence. */
    props: Omit<IFitChainToTargetProps, "target">;

    /** Exact chain geometry and domains, or null for an inadmissible chain. */
    prepared: IPreparedChainPlant | null;

    /** One lazy preparation shared by all bend/orientation targets of this source. */
    rig: IRig;

    /** Fixed source triangle geometry, read only at the first original analytic solve; each target owns its own reach geometry. */
    articulation(): ReturnType<typeof twoBoneChainArticulation.prepare>;

    /** Fresh pose and joint array with the fixed source's ordered non-bend prefix, then the two supplied articulations. */
    pose(upper: IAutoMovieJointPose, lower: IAutoMovieJointPose): IAutoMoviePose;

    /** Apply the shared actual rig clamp, resolving its lookup only at first use. */
    clamp(joint: IAutoMovieJointPose): IAutoMovieJointPose;

    /** Squared-radian turn from a raw candidate quaternion to the fixed last-record reference. */
    continuity(
      bone: AutoMovieHumanoidBone,
      rotation: IAutoMovieQuaternion,
    ): number;

    /** Source upper/mid continuity, first read at the original explicit-reference site. */
    authoredContinuity(): number;

    /** Read actual source FK and joint maps once, after analytic target admission. */
    read(): IReading;

    /** Read the fixed reference mid frame under the unchanged source root and non-chain pose once. */
    referenceLower(): IAutoMovieResolvedBone;
  }
}
