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
import { prepareSkeletonPoseResolution } from "../kinematics/prepareSkeletonPoseResolution";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { twoBoneChainArticulation } from "../kinematics/twoBoneChainArticulation";
import { Quaternion } from "../math/Quaternion";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
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
 * The internal fixed workspace is produced only by prepareSource from the
 * same immutable six source fields and no goal fields. It shares source
 * geometry, axes, authored readings, articulation and non-bend pose prefix;
 * each new workspace still owns its reference, continuity and goal policy.
 * Explicit curve continuation can request complete source admission without
 * demanding authored effector FK. The supplied immutable rig resolves an
 * empty output demand but still admits every current joint/root in order.
 * The rig factory proves its original own data-method; foreign, copied,
 * proxied or replaced readers retain the full authored path. Completion belongs
 * only to this unchanged source, and failure publishes no completion state.
 * A plant that places the chain from its rig constants (`placeChainPlant`)
 * hands over the constants' rig-only readers with it, which the caller built
 * for these same clinical tables; any other chain gets readers of its own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the borrowed inputs, caller-owned lifetime and laziness that preserves degenerate-target admission order.
 * @evidence contracts/development/implementation.md#principled-implementation Separates target-independent FK/domains and last-record joint maps from target-specific analytic solving, using the same skeleton axis precedence and resolveBoneMap as the one-shot fit.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure prepareChainFitRig owns rig/source preparation. This workspace separates actual source admission from authored-frame demand and owns continuity. Ordinary fitChainBend keeps search ordering; its shared hinge owner also serves explicit continuation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No search, tolerance, seed, callback result or constraint is approximated; lazy authored/reference reads retain the original order in which a degenerate analytic solve returns without reading them.
 * @evidence contracts/development/implementation.md#efficient-algorithms One geometry/domain preparation and lazy source/reference FK serve a workspace. A fixed source shares axes, geometry, source maps, articulation and prefix across goals. Explicit continuation's empty rig demand performs actual O(J) admission without unused authored ancestry/output, once per fixed source; raw callers keep full authored FK. Reference/continuity remain goal-local and all target solving remains. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The internal fixed workspace comes from identical immutable six source fields without goals. Successful actual admission is shared only in that lifetime; each binding owns references/weight/continuity. The rig producer certifies the original own data-method before real ordered admission; unknown/replaced/copied/proxied readers and raw/no-rig retain the authored path. Completion is set only after success, never from identity alone or caller flags. Ordinary lazy getters keep first-use order.
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
  fixed?: prepareChainFit.IWorkspace,
  plant?: () => IPreparedChainPlant | null,
): prepareChainFit.IWorkspace {
  const props: Omit<IFitChainToTargetProps, "target"> = {
    ...source,
    jointAxes: fixed?.props.jointAxes ?? poseResolution?.jointAxes ??
      skeletonJointAxes(source.skeleton, source.jointAxes),
  };
  // A caller that holds the rig's chain constants and the pose's frame of
  // the chain root's parent places the chain itself (`placeChainPlant`);
  // otherwise the articulation-free pose is read by forward kinematics.
  const prepared: IPreparedChainPlant | null = fixed === undefined
    ? (plant?.() ?? prepareChainPlant(props, resolution, poseResolution)) : fixed.prepared;
  const rig: prepareChainFit.IRig = prepareChainFitRig(props, prepared, fixed?.rig);
  let reading: prepareChainFit.IReading | undefined;
  let referenceLower: IAutoMovieResolvedBone | undefined;
  let articulation:
    | ReturnType<typeof twoBoneChainArticulation.prepare>
    | undefined;
  let authoredContinuity: number | undefined;
  let retainedJoints: readonly IAutoMovieJointPose[] | undefined;
  let sourceAdmitted: boolean = false;
  const prior: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion> = new Map();
  const workspace: prepareChainFit.IWorkspace = {
    props,
    prepared,
    rig,
    admitSource: fixed?.admitSource ?? ((): void => {
      if (sourceAdmitted || reading !== undefined) return;
      if (poseResolution === undefined ||
        !prepareSkeletonPoseResolution.admitSource(poseResolution, props.pose, resolution))
        workspace.read();
      sourceAdmitted = true;
    }),
    articulation: fixed?.articulation ?? ((): ReturnType<typeof twoBoneChainArticulation.prepare> => {
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
    }),
    pose: fixed?.pose ?? ((
      upper: IAutoMovieJointPose,
      lower: IAutoMovieJointPose,
    ): IAutoMoviePose => {
      retainedJoints ??= props.pose.joints.filter(
        (joint: IAutoMovieJointPose): boolean =>
          joint.bone !== props.chain.upper && joint.bone !== props.chain.lower,
      );
      return { ...props.pose, joints: [...retainedJoints, upper, lower] };
    }),
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
      const known: prepareChainFit.IReading | undefined = fixed?.read();
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> | undefined =
        known !== undefined ? undefined :
        readAuthored === undefined
          ? readBones(props.pose, new Set([props.chain.effector]))
          : readAuthored();
      const authoredAngles: ReadonlyMap<
        AutoMovieHumanoidBone,
        IAutoMovieJointPose
      > = known?.authoredAngles ?? indexJoints(props.pose.joints);
      const referencePose: typeof props.pose =
        props.referencePose ?? props.pose;
      reading = {
        authored: known?.authored ?? bones!.get(props.chain.effector)!.worldPosition,
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
    return poseResolution.resolveMap(pose, resolution, requested);
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
    /** Exact gate overshoot scorer for this bone's fixed domain under the original canonical scoring frame; the optional rotation is the one the angles were read from on that frame (`scanJointRom.prepare`). */
    overshoot(bone: AutoMovieHumanoidBone): (joint: IAutoMovieJointPose, rotation?: IAutoMovieQuaternion) => number;

    /** The same scorer of a bone gated by swing and twist, read from the rotation alone (`scanJointRom.prepareRotated`); null for a bone the gate does not hold. */
    rotatedOvershoot(bone: AutoMovieHumanoidBone): ((rotation: IAutoMovieQuaternion) => number) | null;

    /** Actual skeleton record; an absent bone is remembered too. */
    bone(bone: AutoMovieHumanoidBone): IAutoMovieBone | undefined;

    /** Effective ROM, sharing the geometry's already prepared upper/lower domains. */
    domain(bone: AutoMovieHumanoidBone): IAutoMovieJointRotationDomain;

    /** Existing basisOf/orientation nullish default at the original diagnostic path; failures are not cached. */
    basis(bone: AutoMovieHumanoidBone, path: string): IAutoMovieJointAxes;

    /** Direct clinical conversion's undefined-only default; runtime null must still fail even after a lenient default read. */
    jointBasis(bone: AutoMovieHumanoidBone, path: string): IAutoMovieJointAxes;

    /** A bone's prepared record composer on its `jointBasis` and the given rest frame (`jointToQuaternionOnBasis.prepare`), kept while the frame record is the same: the chain's records of every read of a fit composed by one composer a bone. */
    composer(bone: AutoMovieHumanoidBone, frame: IAutoMovieRestFrame | undefined): ReturnType<typeof jointToQuaternionOnBasis.prepare>;

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

    /**
     * Actually admit the unchanged complete source/root without demanding an
     * unused authored effector frame. A genuine immutable rig with its original
     * own data-method retains all joint/clinical admission with empty FK demand.
     * Unknown/replaced readers and raw callers keep the full authored read. Only this source
     * operation shares successful completion, never a caller-supplied flag.
     */
    admitSource(): void;

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
