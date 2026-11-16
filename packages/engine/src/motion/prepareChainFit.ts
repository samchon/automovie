import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { Quaternion } from "../math/Quaternion";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import type { IPreparedChainPlant } from "./IPreparedChainPlant";
import { prepareChainPlant } from "./prepareChainPlant";
import { resolveBoneMap } from "./resolveBoneMap";

/**
 * Prepare the unchanged dependencies of several target fits for one chain.
 * The caller owns the lifetime and keeps the rig, source/reference poses,
 * topology, clinical tables and callbacks unchanged until the fits finish.
 * An optional authored reader must return full FK of that exact source pose
 * with the same rig/mappings; it is read only at the original lazy FK site.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the borrowed inputs, caller-owned lifetime and laziness that preserves degenerate-target admission order.
 * @evidence contracts/development/implementation.md#principled-implementation Separates target-independent FK/domains and last-record joint maps from target-specific analytic solving, using the same skeleton axis precedence and resolveBoneMap as the one-shot fit.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation record and lazy readers own invariant work; fitChainBend remains the sole owner of search and ranking.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No search, tolerance, seed, callback result or constraint is approximated; lazy authored/reference reads retain the original order in which a degenerate analytic solve returns without reading them.
 * @evidence contracts/development/implementation.md#efficient-algorithms One rig-domain preparation, at most one authored FK and one reference-mid FK plus O(J) joint maps serve all targets. An exact authored reader reuses a caller's existing full FK. Chain clamp lookups, prior quaternion conversions and authored continuity are lazy once; target-dependent candidate costs and callback evaluations are unchanged.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only fixed dependencies of this scoped source are shared. The optional full-FK reader has the exact source pose/rig/mappings, while candidate quaternions and prior rotations retain the original conversion and normalization order at first use. Changed inputs require a new workspace.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The workspace borrows fixed inputs and its optional reader and retains at most two O(J) maps, two chain-clamp closures, two prior quaternions, one continuity scalar and two frame reads; caller release frees this scope, with no global cache or handles.
 */
export function prepareChainFit(
  source: Omit<IFitChainToTargetProps, "target">,
  readAuthored?: () => ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieResolvedBone
  >,
): prepareChainFit.IWorkspace {
  const props: Omit<IFitChainToTargetProps, "target"> = {
    ...source,
    jointAxes: skeletonJointAxes(source.skeleton, source.jointAxes),
  };
  const prepared: IPreparedChainPlant | null = prepareChainPlant(props);
  let reading: prepareChainFit.IReading | undefined;
  let referenceLower: IAutoMovieResolvedBone | undefined;
  let authoredContinuity: number | undefined;
  const prior: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion> = new Map();
  const clamps: Map<
    AutoMovieHumanoidBone,
    (joint: IAutoMovieJointPose) => IAutoMovieJointPose
  > = new Map();
  const workspace: prepareChainFit.IWorkspace = {
    props,
    prepared,
    clamp: (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
      let clamp:
        | ((joint: IAutoMovieJointPose) => IAutoMovieJointPose)
        | undefined = clamps.get(joint.bone);
      if (clamp === undefined) {
        clamp = clampJointToSkeleton.of(joint.bone, props.skeleton);
        clamps.set(joint.bone, clamp);
      }
      return clamp(joint);
    },
    continuity: (
      bone: AutoMovieHumanoidBone,
      rotation: IAutoMovieQuaternion,
    ): number => {
      const candidate: IAutoMovieQuaternion = Quaternion.normalize(rotation);
      let reference: IAutoMovieQuaternion | undefined = prior.get(bone);
      if (reference === undefined) {
        reference = Quaternion.normalize(
          jointToQuaternion(
            workspace.read().referenceAngles.get(bone) ?? {
              bone,
              flexion: null,
              abduction: null,
              twist: null,
            },
            props.jointAxes?.[bone],
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
          jointToQuaternion(
            angles.get(bone) ?? {
              bone,
              flexion: null,
              abduction: null,
              twist: null,
            },
            props.jointAxes?.[bone],
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
          ? resolveBoneMap(
              props.skeleton,
              props.pose,
              props.topology,
              props.jointAxes,
              props.restFrames,
            )
          : readAuthored();
      const authoredAngles: ReadonlyMap<
        AutoMovieHumanoidBone,
        IAutoMovieJointPose
      > = new Map(
        props.pose.joints.map(
          (
            joint: IAutoMovieJointPose,
          ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [
            joint.bone,
            joint,
          ],
        ),
      );
      const referencePose: typeof props.pose =
        props.referencePose ?? props.pose;
      reading = {
        authored: bones.get(props.chain.effector)!.worldPosition,
        authoredAngles,
        referenceAngles:
          referencePose === props.pose
            ? authoredAngles
            : new Map(
                referencePose.joints.map(
                  (
                    joint: IAutoMovieJointPose,
                  ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [
                    joint.bone,
                    joint,
                  ],
                ),
              ),
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
      referenceLower = resolveBoneMap(
        props.skeleton,
        {
          ...props.pose,
          joints: [
            ...props.pose.joints.filter(
              (joint: IAutoMovieJointPose): boolean =>
                joint.bone !== props.chain.upper &&
                joint.bone !== props.chain.lower,
            ),
            ...referenceJoints,
          ],
        },
        props.topology,
        props.jointAxes,
        props.restFrames,
      ).get(props.chain.lower)!;
      return referenceLower;
    },
  };
  return workspace;
}

/**
 * Types shared by the internal preparation producer and bend-search consumer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the producer and consumer of the scoped workspace types.
 * @evidence contracts/development/design.md#principled-representation Fixed input dependencies and lazy derived readings belong to one synchronous fit workspace.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the search's actual invariant data and readers are exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No persistent cache, alternate rig constraint or target history is represented.
 */
export namespace prepareChainFit {
  /**
   * Lazily resolved authored endpoint and last-record clinical joint maps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish actual authored position from joint maps used only for continuity ranking.
   * @evidence contracts/development/design.md#principled-representation Model-metre FK and bone-keyed clinical records preserve the full resolver's last-joint semantics.
   * @evidence contracts/development/design.md#minimal-and-owned-surface fitChainBend reads every member after its analytic solve admits the target.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries actual FK and input joint records, with no surrogate target or copied limits.
   */
  export interface IReading {
    /** Source effector position in resolved model metres. */
    authored: IAutoMovieVector3;

    /** Last source articulation for each bone, borrowed from the input pose. */
    authoredAngles: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose>;

    /** Last reference articulation, or source articulation when no reference was supplied. */
    referenceAngles: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose>;
  }

  /**
   * Target-independent data of an explicitly scoped chain fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed-input borrowing, nullable preparation and the two lazy reads' purposes.
   * @evidence contracts/development/design.md#principled-representation Separates immutable solve dependencies from each target while retaining null preparation as the original invalid-chain result.
   * @evidence contracts/development/design.md#minimal-and-owned-surface fitChainBend reads the fixed props, preparation and both lazy values; no target history or cache controls are exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Caller ownership, rather than mutable-body identity, defines validity; callbacks and near mode remain fixed input data.
   */
  export interface IWorkspace {
    /** Fixed source request with actual skeleton-declared axes taking precedence. */
    props: Omit<IFitChainToTargetProps, "target">;

    /** Exact chain geometry and domains, or null for an inadmissible chain. */
    prepared: IPreparedChainPlant | null;

    /**
     * Clamp a candidate chain joint, resolving that bone's rig lookup only on first use.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States chain-only use and lazy lookup sharing; the original clamp owns ROM semantics.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepareChainFit delegates to clampJointToSkeleton.of.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No body is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature computes no articulation.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The producer documents the once-per-chain-bone lookup.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The producer owns the scoped closure reuse.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires nothing.
     */
    clamp(joint: IAutoMovieJointPose): IAutoMovieJointPose;

    /**
     * Squared sign-insensitive geodesic turn from a raw candidate articulation
     * to this bone's fixed reference; the prior conversion is lazy once.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States raw clinical quaternion, normalization, angular score and fixed-prior sharing.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepareChainFit owns the quaternion angle calculation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No body is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature computes no score.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The producer documents its lazy once prior conversion.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The producer owns the exact scoped prior.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires nothing.
     */
    continuity(
      bone: AutoMovieHumanoidBone,
      rotation: IAutoMovieQuaternion,
    ): number;

    /**
     * The source upper/mid articulation's total turn from the fixed reference,
     * computed only at the search's original explicit-reference first use.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the two source joints, fixed reference and unchanged lazy admission point.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepareChainFit composes the original two continuity scores.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No body is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature computes no score.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The producer documents once-per-workspace source conversion.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The producer owns the fixed-source result.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires nothing.
     */
    authoredContinuity(): number;

    /**
     * Read invariant authored FK and joint maps once, after analytic target admission.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States lazy evaluation and its position after target admission.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepareChainFit owns the lazy implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No body is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature computes no value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The producer documents the once-per-workspace scan and FK.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The producer owns sharing and validity.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires nothing.
     */
    read(): IReading;

    /**
     * Read the reference mid frame under the source's root and non-chain pose once.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Distinguishes reference chain articulation from unchanged source parent pose.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepareChainFit owns the original full-FK reconstruction.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No body is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature computes no frame.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The producer documents its one lazy FK.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The producer owns the shared result.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires nothing.
     */
    referenceLower(): IAutoMovieResolvedBone;
  }
}
