import type {
  AutoMovieHumanoidBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMoviePrepareChainFit,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jointToQuaternionOnBasis } from "../../kinematics/internal/jointToQuaternionOnBasis";
import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import { prepareSkeletonPoseResolution } from "../../kinematics/internal/prepareSkeletonPoseResolution";
import { skeletonJointAxes } from "../../kinematics/internal/skeletonJointAxes";
import { twoBoneChainArticulation } from "../../kinematics/internal/twoBoneChainArticulation";
import { Quaternion } from "../../math/Quaternion";
import { prepareChainFitRig } from "./prepareChainFitRig";
import { prepareChainPlant } from "./prepareChainPlant";
import { resolveBoneMap } from "./resolveBoneMap";

/*
 * Prepare the unchanged dependencies of several target fits for one chain. The
 * caller owns the lifetime and keeps the rig, source/reference poses, topology,
 * clinical tables and callbacks unchanged until the fits finish. An optional
 * authored reader must include this chain's effector FK from the exact source
 * pose and rig/mappings; callers may include other frames they need. Every
 * source joint must still receive ordered admission. The reader is invoked only
 * at the original lazy authored-FK site. A supplied resolution reader is owned
 * by this same synchronous operation, allowing source, zeroed and reference FK
 * to share exact completed math. A supplied poseResolution must be the
 * immutable snapshot of this exact rig, topology and clinical tables. It
 * computes only the chain's demanded frames; omission retains the raw full-FK
 * admission path. The internal fixed workspace is produced only by
 * prepareSource from the same immutable six source fields and no goal fields.
 * It shares source geometry, axes, authored readings, articulation and non-bend
 * pose prefix; each new workspace still owns its reference, continuity and goal
 * policy. Explicit curve continuation can request complete source admission
 * without demanding authored effector FK. The supplied immutable rig resolves
 * an empty output demand but still admits every current joint/root in order.
 * The rig factory proves its original own data-method; foreign, copied, proxied
 * or replaced readers retain the full authored path. Completion belongs only to
 * this unchanged source, and failure publishes no completion state. A plant
 * that places the chain from its rig constants (`placeChainPlant`) hands over
 * the constants' rig-only readers with it, which the caller built for these
 * same clinical tables; any other chain gets readers of its own.
 */
export function prepareChainFit(
  source: Omit<IAutoMovieFitChainToTargetProps, "target">,
  readAuthored?: () => ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieResolvedBone
  >,
  resolution: ReturnType<
    typeof AutoMovieEngineKinematics.preparePoseResolution
  > = AutoMovieEngineKinematics.preparePoseResolution(),
  poseResolution?: prepareSkeletonPoseResolution.IRig,
  fixed?: prepareChainFit.IWorkspace,
  plant?: () => IAutoMoviePreparedChainPlant | null,
): prepareChainFit.IWorkspace {
  const props: Omit<IAutoMovieFitChainToTargetProps, "target"> = {
    ...source,
    jointAxes:
      fixed?.props.jointAxes ??
      poseResolution?.jointAxes ??
      skeletonJointAxes(source.skeleton, source.jointAxes),
  };
  // A caller that holds the rig's chain constants and the pose's frame of
  // the chain root's parent places the chain itself (`placeChainPlant`);
  // otherwise the articulation-free pose is read by forward kinematics.
  const prepared: IAutoMoviePreparedChainPlant | null =
    fixed === undefined
      ? (plant?.() ?? prepareChainPlant(props, resolution, poseResolution))
      : fixed.prepared;
  const rig: prepareChainFit.IRig = prepareChainFitRig(
    props,
    prepared,
    fixed?.rig,
  );
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
    admitSource:
      fixed?.admitSource ??
      ((): void => {
        if (sourceAdmitted || reading !== undefined) return;
        if (
          poseResolution === undefined ||
          !prepareSkeletonPoseResolution.admitSource(
            poseResolution,
            props.pose,
            resolution,
          )
        )
          workspace.read();
        sourceAdmitted = true;
      }),
    articulation:
      fixed?.articulation ??
      ((): ReturnType<typeof twoBoneChainArticulation.prepare> => {
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
    pose:
      fixed?.pose ??
      ((
        upper: IAutoMovieJointPose,
        lower: IAutoMovieJointPose,
      ): IAutoMoviePose => {
        retainedJoints ??= props.pose.joints.filter(
          (joint: IAutoMovieJointPose): boolean =>
            joint.bone !== props.chain.upper &&
            joint.bone !== props.chain.lower,
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
          jointToQuaternionOnBasis.run(
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
          jointToQuaternionOnBasis.run(
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
      const bones:
        | ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
        | undefined =
        known !== undefined
          ? undefined
          : readAuthored === undefined
            ? readBones(props.pose, new Set([props.chain.effector]))
            : readAuthored();
      const authoredAngles: ReadonlyMap<
        AutoMovieHumanoidBone,
        IAutoMovieJointPose
      > = known?.authoredAngles ?? indexJoints(props.pose.joints);
      const referencePose: typeof props.pose =
        props.referencePose ?? props.pose;
      reading = {
        authored:
          known?.authored ?? bones!.get(props.chain.effector)!.worldPosition,
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

  /*
   * Preserve raw FK admission unless the caller supplies its genuine immutable
   * rig.
   */
  function readBones(
    pose: IAutoMoviePose,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    if (poseResolution === undefined)
      return resolveBoneMap(
        props.skeleton,
        pose,
        props.topology,
        props.jointAxes,
        props.restFrames,
        resolution,
      );
    return poseResolution.resolveMap(pose, resolution, requested);
  }
}

/*
 * Internal source records and lazy rig data for one unchanged fit operation.
 */
export namespace prepareChainFit {
  /*
   * Actual model-metre FK and last-record joint maps, read after analytic
   * target admission.
   */
  export interface IReading {
    /*
     * Source effector position in resolved model metres.
     */
    authored: IAutoMovieVector3;

    /*
     * Last source articulation for each bone, borrowed from the input pose.
     */
    authoredAngles: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose>;

    /*
     * Last reference articulation, or source articulation when no reference was
     * supplied.
     */
    referenceAngles: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose>;
  }

  /** The interface contract (`IAutoMoviePrepareChainFit.IRig`). */
  export type IRig = IAutoMoviePrepareChainFit.IRig;

  /*
   * Fixed source request and lazy readings; callers keep all dependencies
   * unchanged until release.
   */
  export interface IWorkspace {
    /*
     * Fixed source request with actual skeleton-declared axes taking
     * precedence.
     */
    props: Omit<IAutoMovieFitChainToTargetProps, "target">;

    /*
     * Exact chain geometry and domains, or null for an inadmissible chain.
     */
    prepared: IAutoMoviePreparedChainPlant | null;

    /*
     * One lazy preparation shared by all bend/orientation targets of this
     * source.
     */
    rig: IRig;

    /*
     * Actually admit the unchanged complete source/root without demanding an
     * unused authored effector frame. A genuine immutable rig with its original
     * own data-method retains all joint/clinical admission with empty FK
     * demand. Unknown/replaced readers and raw callers keep the full authored
     * read. Only this source operation shares successful completion, never a
     * caller-supplied flag.
     */
    admitSource(): void;

    /*
     * Fixed source triangle geometry, read only at the first original analytic
     * solve; each target owns its own reach geometry.
     */
    articulation(): ReturnType<typeof twoBoneChainArticulation.prepare>;

    /*
     * Fresh pose and joint array with the fixed source's ordered non-bend
     * prefix, then the two supplied articulations.
     */
    pose(
      upper: IAutoMovieJointPose,
      lower: IAutoMovieJointPose,
    ): IAutoMoviePose;

    /*
     * Apply the shared actual rig clamp, resolving its lookup only at first
     * use.
     */
    clamp(joint: IAutoMovieJointPose): IAutoMovieJointPose;

    /*
     * Squared-radian turn from a raw candidate quaternion to the fixed
     * last-record reference.
     */
    continuity(
      bone: AutoMovieHumanoidBone,
      rotation: IAutoMovieQuaternion,
    ): number;

    /*
     * Source upper/mid continuity, first read at the original
     * explicit-reference site.
     */
    authoredContinuity(): number;

    /*
     * Read actual source FK and joint maps once, after analytic target
     * admission.
     */
    read(): IReading;

    /*
     * Read the fixed reference mid frame under the unchanged source root and
     * non-chain pose once.
     */
    referenceLower(): IAutoMovieResolvedBone;
  }
}

/*
 * Index borrowed source/reference records without new admission; later
 * duplicates replace earlier ones without copying joints.
 */
function indexJoints(
  joints: readonly IAutoMovieJointPose[],
): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose> {
  const indexed: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map();
  for (const joint of joints) indexed.set(joint.bone, joint);
  return indexed;
}
