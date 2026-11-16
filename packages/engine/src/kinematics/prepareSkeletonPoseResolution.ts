import type {
  AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieJointAxes, IAutoMovieJointPose,
  IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieSkeleton,
} from "@automovie/interface";

import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import type { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { SKELETON_ROOT_PARENT } from "./constants/SKELETON_ROOT_PARENT";
import { indexSkeletonTopology } from "./indexSkeletonTopology";
import type { preparePoseResolution } from "./preparePoseResolution";
import { preparePoseResolutionState } from "./preparePoseResolutionState";
import { PoseResolutionSnapshot } from "./PoseResolutionSnapshot";
import { skeletonJointAxes } from "./skeletonJointAxes";

/** The immutable node representation shared with the dynamic FK owner. */
type INode = preparePoseResolutionState.INode;

/** Raw immutable clinical inputs with one shared successful basis admission. */
type IConvention = preparePoseResolutionState.IConvention;

/**
 * Snapshot a rig's static FK prerequisites once, then resolve changing poses
 * through operation-owned dependency rows. Rest translations and rotations,
 * axis precedence, clinical bases, affine frames and the reachable
 * parent order are copied here; later edits to the source rig/tables do not
 * change this snapshot. Reprepare explicitly to adopt such edits.
 *
 * Every authored joint is admitted in its original order, even an overwritten,
 * unreachable or undemanded record. A requested set limits returned bones and
 * the computed ancestor closure, preserving the full walk's relative order.
 * Omission returns all reachable bones. Root and rest scale remain ignored.
 * Root placement keeps the ordinary parent-first arithmetic; root-null reads
 * reuse the independent root-relative frames. Every output is fresh plain data.
 * prepareBones snapshots fixed output membership/order once. preparePose
 * actually admits a fixed source/root once, then accepts complete appended
 * edit lists; absent edits restore that source. Neither companion stores a
 * pose identity, target answer or query-result history.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines static snapshot invalidation, complete-pose, individual-joint and fixed-source admission, fixed-demand membership, ignored scale, parent-first arithmetic and fresh output ownership. IRig and IBoneDemand member prose below states exact scopes, units, defaults, costs and release boundaries.
 * @evidence contracts/development/implementation.md#principled-implementation Existing skeletonJointAxes merging remains authoritative; its effective own/custom-prototype mappings and rest frames snapshot direct lookup, including non-enumerable fields and undefined shadowing. Immutable rest data defines actual DFS subtree intervals. Final articulation changes revise affected descendants, and exact root tuples retain ordinary Hamilton grouping. Basis/frame admission remains lazy at actual use.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns static snapshots, the merged raw-axis table and sparse dependency state. Complete-pose, individual-joint and fixed-source reads share the same actual convention/admission owner. PoseResolutionSnapshot owns copies and resolvePreparedPoseFrame owns composition reuse; no target or fit policy is owned here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose identity, timestamp, tolerance or result flag certifies equivalence. All authored records retain finite-angle admission and last-record precedence, missing articulation is identity, and unreachable requested bones remain absent. Raw resolvePose retains its live-input behavior.
 * @evidence contracts/development/implementation.md#efficient-algorithms Static preparation is linear in bones and supplied axis/frame populations. Ordinary reads admit J records, compare active membership, sort C actual final changes and revise A affected descendants once; K names sort unless bound, and only invalidated demanded ancestry is checked before K fresh copies. preparePose admits/snapshots baseline once, then only E current edits precede those same dependency updates. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Static values are owned snapshots. Actual used basis/axis/affine prerequisites and actual neutral root-relative FK stay with the immutable rig; dynamic composers remain independent. Normal/bound demands share operation rows. Fixed-source production actually admits all baseline records/root once, optionally sharing completed joint conversion, then keeps independent overlay state. Missing edits restore baseline and changed dependencies remain visible.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The rig owns O(B+A+F) static data and weak operation-reader entries of O(U+B) current rows each. Bound demands own K indices and retain no operation or pose. Fixed-source workspaces own O(B+U) baseline/overlay rows until caller release. No authored pose, result/time history, task or handle is retained.
 */
export function prepareSkeletonPoseResolution(
  skeleton: IAutoMovieSkeleton,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
): prepareSkeletonPoseResolution.IRig {
  const conventions: Map<string, IConvention> = new Map();
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    skeletonJointAxes(skeleton, jointAxes);
  const fallback: IConvention = {
    axes: PoseResolutionSnapshot.axes(DEFAULT_JOINT_AXES),
  };
  for (const [name, basis] of PoseResolutionSnapshot.entries(axes))
    conventions.set(name, {
      axes: PoseResolutionSnapshot.axes(basis),
    });
  for (const [name, frame] of PoseResolutionSnapshot.entries(restFrames)) {
    const convention: IConvention | undefined = conventions.get(name);
    conventions.set(name, {
      axes: convention === undefined ? fallback.axes : convention.axes,
      frame: PoseResolutionSnapshot.frame(frame),
    });
  }
  const nodes: INode[] = [];
  const indices: Map<AutoMovieHumanoidBone, number> = new Map();
  const append: (bone: IAutoMovieBone, parent: number) => void = (
    bone: IAutoMovieBone,
    parent: number,
  ): void => {
    const index: number = nodes.length;
    indices.set(bone.bone, index);
    nodes.push({
      name: bone.bone,
      parent,
      subtreeEnd: index + 1,
      translation: PoseResolutionSnapshot.vector(bone.rest.translation),
      rotation: PoseResolutionSnapshot.quaternion(bone.rest.rotation),
    });
    const children: readonly IAutoMovieBone[] | undefined =
      topology.childrenByParent.get(bone.bone);
    if (children !== undefined)
      for (const child of children) append(child, index);
    nodes[index]!.subtreeEnd = nodes.length;
  };
  const roots: readonly IAutoMovieBone[] | undefined =
    topology.childrenByParent.get(SKELETON_ROOT_PARENT);
  if (roots !== undefined) for (const root of roots) append(root, -1);
  const operations: WeakMap<ReturnType<typeof preparePoseResolution>, preparePoseResolutionState.IReader> =
    new WeakMap();
  const preparedAxes: Readonly<Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>> =
    Object.freeze(Object.fromEntries(Array.from(conventions,
      ([name, convention]: [string, IConvention]): [string, IAutoMovieJointAxes] =>
        [name, convention.axes],
    )));
  return {
    jointAxes: preparedAxes,
    joint: (joint: IAutoMovieJointPose, operation?: ReturnType<typeof preparePoseResolution>): IAutoMovieQuaternion =>
      readerOf(operation).joint(joint),
    preparePose: (pose: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>, operation?: ReturnType<typeof preparePoseResolution>): preparePoseResolutionState.IOverlayReader =>
      operation === undefined
        ? preparePoseResolutionState.preparePose(nodes, indices, conventions, fallback, pose, requested)
        : readerOf(operation).preparePose(pose, requested),
    prepareBones: (requested: ReadonlySet<AutoMovieHumanoidBone>): prepareSkeletonPoseResolution.IBoneDemand => {
      const read: ReturnType<typeof preparePoseResolutionState.prepareDemand> =
        preparePoseResolutionState.prepareDemand(indices, nodes.length, requested);
      return { resolve: (pose: IAutoMoviePose, operation?: ReturnType<typeof preparePoseResolution>): IAutoMovieResolvedBone[] =>
        read(readerOf(operation), pose) };
    },
    resolve: (
      pose: IAutoMoviePose,
      operation?: ReturnType<typeof preparePoseResolution>,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieResolvedBone[] => {
      return readerOf(operation).resolve(pose, requested);
    },
  };

  /** All output demands of the same operation borrow one actual dependency state. */
  function readerOf(operation?: ReturnType<typeof preparePoseResolution>): preparePoseResolutionState.IReader {
    let reader: preparePoseResolutionState.IReader | undefined = operation === undefined
      ? undefined : operations.get(operation);
    if (reader === undefined) {
      reader = preparePoseResolutionState(nodes, indices, conventions, fallback);
      if (operation !== undefined) operations.set(operation, reader);
    }
    return reader;
  }
}

/**
 * Explicit immutable rig snapshot and its fresh-output demand resolver.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States static snapshot lifetime, operation ownership, current complete-pose resolution and fixed-demand/source companion semantics.
 * @evidence contracts/development/design.md#principled-representation IRig couples an immutable rooted rest graph and raw clinical snapshot to actual individual-joint admission, complete poses, fixed sources and fixed demands. IBoneDemand fixes reachable output membership/order; poses retain clinical degrees and model-metre placement. Producer/runtime owners retain axis, angle and graph admission, without type-only finiteness claims.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Body/chain consumers use resolve and jointAxes; fixed chain-frame recovery uses joint to share actual effector admission. Flight mass reads use prepareBones/IBoneDemand.resolve and digit probes preparePose/IOverlayReader.resolve. Existing interface/ROM types own quantities; indices, rows, revisions and target answers remain private.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene, fixed body subset, editable whitelist, trusted boolean or user-constructible admitted-rest record replaces actual admission. The genuine producer snapshots its inputs; every ordinary pose or overlay query retains its stated validation and every public transform is fresh.
 */
export namespace prepareSkeletonPoseResolution {
  /**
   * Immutable prepared FK, independent of later source rig or table edits.
   *
   * Complete poses use current clinical degrees/root placement; fixed-source
   * queries append complete edits to an actually admitted source. Fixed demand
   * selects reachable outputs without exposing numeric indices or state rows.
   */
  export interface IRig {
    /**
     * Admit one current clinical joint against this rig's actual fixed axes
     * and frame, then return a fresh quaternion. Same-operation reads may
     * share exact completed conversion with preceding full pose admission;
     * no caller flag certifies it and every current coordinate is checked.
     * Constant-size work stores only a last successful row under the lent
     * operation, or call-local state without one. It completes no pose/FK.
     */
    joint(joint: IAutoMovieJointPose, operation?: ReturnType<typeof preparePoseResolution>): IAutoMovieQuaternion;

    /**
     * Admit/snapshot a fixed source/root, optionally binding names and borrowing
     * exact completed conversion from this same operation. Ordered admission
     * and the shared sparse FK produce baseline-plus-complete-edit queries;
     * no source record or external resolved flag is presumed valid.
     * O(J+B) setup precedes E-edit, actual changed-subtree and invalidated-
     * ancestry work with fresh output; optional names may be bound once.
     * Independent O(B+U) overlay rows end with this source operation; source
     * edits require a new workspace and no source pose/result history is kept.
     */
    preparePose(source: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>, operation?: ReturnType<typeof preparePoseResolution>): preparePoseResolutionState.IOverlayReader;

    /**
     * Snapshot reachable requested names/order once, in O(K log K), using this
     * actual immutable rig. Each resulting query still admits the complete
     * pose and follows ordinary sparse FK, sharing its exact operation rows.
     * Only K indices are retained until demand release; no external numeric
     * list, admission flag, pose or target answer is retained or accepted.
     */
    prepareBones(requested: ReadonlySet<AutoMovieHumanoidBone>): IBoneDemand;

    /** Immutable merged raw-axis snapshot for the same rig's IK; normalization remains lazy at each original use site. */
    readonly jointAxes: Readonly<Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>>;

    /**
     * Admit all current pose records in order, then return fresh requested
     * reachable model-metre frames, all when names are absent. Shared sparse
     * FK keeps ordinary quaternion grouping and exact scalar invalidation;
     * no time/target result substitutes for current admission.
     * Current admission, actual changed-subtree revision and invalidated-
     * ancestry checks precede K fresh copies and optional live-name sorting.
     * O(B+U) rows end with the lent reader, or this call without supply.
     */
    resolve(
      pose: IAutoMoviePose,
      operation?: ReturnType<typeof preparePoseResolution>,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieResolvedBone[];
  }

  /**
   * A genuine immutable rig's fixed requested-bone snapshot.
   *
   * Actual rig name lookup fixes reachable output membership/order. Queries
   * supply complete current poses; numeric indices and state stay private.
   */
  export interface IBoneDemand {
    /**
     * Admit the current complete pose and return fresh captured model-metre
     * frames through the same sparse FK, without re-sorting names. Exact
     * scalar/ancestor/root dependencies share the lent operation's rows;
     * no pose identity or answer is cached. Current admission and actual
     * changed-subtree updates precede invalidated ancestry and K copies.
     * O(B+U) rows end with the reader, or this call without reader supply.
     */
    resolve(pose: IAutoMoviePose, operation?: ReturnType<typeof preparePoseResolution>): IAutoMovieResolvedBone[];
  }
}

