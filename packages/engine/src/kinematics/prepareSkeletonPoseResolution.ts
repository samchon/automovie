import type {
  AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieJointAxes,
  IAutoMoviePose, IAutoMovieSkeleton,
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines explicit snapshot ownership/invalidation, ordered joint admission, requested-output membership/order, ignored scale, unchanged parent-first arithmetic and fresh output ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Immutable rest frames define a rooted FK graph. Exact joint values and parent revisions determine local/root-relative frames; a separate exact root tuple determines placed frames using the same Hamilton products and parent-rotated offsets as resolvePose. A basis is normalized once on its first authored use; affine frames retain the existing null-angle and per-axis admission rules.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns static snapshots, the merged raw-axis table shared with IK and sparse dependency state. PoseResolutionSnapshot owns copies and resolvePreparedPoseFrame owns private composition reuse; existing admission/math owners retain their formulas. No target or fit policy is owned here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose identity, timestamp, tolerance or result flag certifies equivalence. All authored records retain finite-angle admission and last-record precedence, missing articulation is identity, and unreachable requested bones remain absent. Raw resolvePose retains its live-input behavior.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation is O(B+A+F). A call admits O(J) records, sorts K requested reachable indices in O(K log K), visits only their D ancestors, and copies K outputs; omitted demand visits B bones. Only changed articulation/ancestor/root dependencies compose transforms, while unchanged root-relative frames survive root changes. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Static values are producer-owned snapshots. Per-operation rows compare actual clinical scalars, selected articulation and ancestor revisions; removed joints use the current invocation's absence. Placed rows additionally depend on all seven current root scalars, keeping ancestor changes and root edits visible without retaining input pose identity.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The rig owns O(B+A+F) immutable data and a weak map keyed by explicitly supplied live operation readers. Each live reader owns at most O(U+B) joint/frame rows for this rig; an omitted reader uses unretained call-local rows. No authored pose, result, time history, task or handle is retained.
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
  for (const [name, basis] of Object.entries(axes))
    if (basis !== undefined)
      conventions.set(name, {
        axes: PoseResolutionSnapshot.axes(basis),
      });
  for (const [name, frame] of Object.entries(restFrames ?? {})) {
    if (frame === undefined) continue;
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
      translation: PoseResolutionSnapshot.vector(bone.rest.translation),
      rotation: PoseResolutionSnapshot.quaternion(bone.rest.rotation),
    });
    const children: readonly IAutoMovieBone[] | undefined =
      topology.childrenByParent.get(bone.bone);
    if (children !== undefined)
      for (const child of children) append(child, index);
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
    preparePose: (pose: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>): preparePoseResolutionState.IOverlayReader =>
      preparePoseResolutionState.preparePose(nodes, indices, conventions, fallback, pose, requested),
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
 * @evidence contracts/development/common.md#meaningful-documentation States snapshot lifetime, operation-reader ownership and requested reachable output semantics on the single resolver member.
 * @evidence contracts/development/design.md#principled-representation One prepared rig resolves clinical degree poses into model-metre frames; optional demand selects output membership without weakening authored admission, while a caller-owned reader identifies only dynamic-work lifetime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Body/chain FK reads resolve and IK reuses the exact merged raw-axis snapshot through jointAxes. Dynamic revisions, mutable frame rows and target answers remain private.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No trusted boolean or user-constructible admitted rest record bypasses raw validation. This producer alone supplies snapshot behavior; results are fresh and omitted operations retain no dynamic history.
 */
export namespace prepareSkeletonPoseResolution {
  /**
   * Immutable prepared FK, independent of later source rig or table edits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the snapshot and resolve member's optional operation lifetime and requested output population.
   * @evidence contracts/development/design.md#principled-representation A fixed rest graph and clinical convention map clinical degrees to model-metre frames; optional demand selects reachable outputs, while every authored record remains admitted.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The body and chain consumers use resolve; prepareChainFit reuses the immutable raw-axis table instead of merging the skeleton again. Internal revisions, mutable rows and target answers remain private.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No admission boolean, cast or fixture-specific bone set is exposed. Only the producer supplies the immutable data and every result owns fresh transform records.
   */
  export interface IRig {
    /** Admit/snapshot a fixed source once; each query supplies its complete appended edits, with fresh requested output. Release the workspace when that source operation ends. */
    preparePose(source: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>): preparePoseResolutionState.IOverlayReader;

    /** Snapshot requested membership/order once, then resolve changing complete poses through operation-owned rows without repeating demand preparation. */
    prepareBones(requested: ReadonlySet<AutoMovieHumanoidBone>): IBoneDemand;

    /** Immutable merged raw-axis snapshot for the same rig's IK; normalization remains lazy at each original use site. */
    readonly jointAxes: Readonly<Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>>;

    /** Resolve all or only requested reachable bones, borrowing an operation reader's lifetime for exact computation reuse; every authored record is still admitted in order. */
    resolve(
      pose: IAutoMoviePose,
      operation?: ReturnType<typeof preparePoseResolution>,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieResolvedBone[];
  }

  /**
   * A genuine immutable rig's fixed requested-bone snapshot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States captured rig/name membership and fresh complete-pose query outputs with optional operation ownership.
   * @evidence contracts/development/design.md#principled-representation Immutable rooted indices fix output membership/order while each complete pose supplies current clinical/root values in model metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface poseBones.prepare needs only resolve; names, numeric indices and internal state stay private.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The actual rig producer derives the demand from a supplied name set; no external numeric indices, pose-admission flag or cached target answer is exposed.
   */
  export interface IBoneDemand {
    /** Admit the current complete pose and return fresh captured requested transforms; optional reader identity scopes exact dynamic reuse. */
    resolve(pose: IAutoMoviePose, operation?: ReturnType<typeof preparePoseResolution>): IAutoMovieResolvedBone[];
  }
}

