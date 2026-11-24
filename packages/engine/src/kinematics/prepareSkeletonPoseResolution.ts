import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  IAutoMovieSkeletonPoseResolution,
  IAutoMovieSkeletonTopology,
  IAutoMovieVector3,
} from "@automovie/interface";

import { PoseResolutionSnapshot } from "./PoseResolutionSnapshot";
import { composePoseFrames } from "./composePoseFrames";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { SKELETON_ROOT_PARENT } from "./constants/SKELETON_ROOT_PARENT";
import { indexSkeletonTopology } from "./indexSkeletonTopology";
import { preparePoseBoneDemand } from "./preparePoseBoneDemand";
import { preparePoseJointResolution } from "./preparePoseJointResolution";
import type { preparePoseReading } from "./preparePoseReading";
import { preparePoseResolution } from "./preparePoseResolution";
import { preparePoseResolutionState } from "./preparePoseResolutionState";
import { preparePoseTupleScan } from "./preparePoseTupleScan";
import { skeletonJointAxes } from "./skeletonJointAxes";

/** The immutable node representation shared with the dynamic FK owner. */
type INode = preparePoseResolutionState.INode;

/** Raw immutable clinical inputs with one shared successful basis admission. */
type IConvention = preparePoseResolutionState.IConvention;

/** Owned static values cross into runtime binding without their source scope. */
interface ISnapshot {
  /** Copied rooted rest graph; no source bone records remain. */
  nodes: readonly INode[];

  /** Actual copied name-to-node lookup. */
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>;

  /** Copied clinical prerequisites, admitted lazily at actual use. */
  conventions: ReadonlyMap<string, IConvention>;

  /** Copied ordinary default clinical convention. */
  fallback: IConvention;

  /** Public frozen raw-axis snapshot used by same-rig IK. */
  axes: Readonly<Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>>;
}

/**
 * Snapshot a rig's static FK prerequisites once, then resolve changing poses
 * through operation-owned dependency rows. Rest translations and rotations,
 * axis precedence, clinical bases, affine frames and the reachable parent order
 * are copied here; later edits to the source rig/tables do not change this
 * snapshot. Reprepare explicitly to adopt such edits.
 *
 * Every authored joint is admitted in its original order, even an overwritten,
 * unreachable or undemanded record. Joint records are values: a record is not
 * edited after the rig admitted it, and a changed articulation is a new record
 * (a pose's list of records may change; the rig keeps no list). The rig reads a
 * record it already admitted as the value it admitted, without reading its
 * coordinates again, so a pose made of another's records (a limb's reduced
 * pose, a fit merged back) costs a lookup a shared record. A requested set
 * limits returned bones and the computed ancestor closure, preserving the full
 * walk's relative order. Omission returns all reachable bones. Root and rest
 * scale remain ignored. Root placement keeps the ordinary parent-first
 * arithmetic; root-null reads reuse the independent root-relative frames. Every
 * output is fresh plain data. prepareBones snapshots fixed output
 * membership/order once. preparePose actually admits a fixed source/root once,
 * then accepts complete appended edit lists; absent edits restore that source.
 * Neither companion stores a pose identity, target answer or query-result
 * history.
 */
export function prepareSkeletonPoseResolution(
  skeleton: IAutoMovieSkeleton,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
): prepareSkeletonPoseResolution.IRig {
  return bindSnapshot(snapshotRig(skeleton, jointAxes, restFrames, topology));
}

/** Copy source prerequisites before any long-lived runtime closure is created. */
function snapshotRig(
  skeleton: IAutoMovieSkeleton,
  jointAxes:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    | undefined,
  restFrames:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>
    | undefined,
  topology: IAutoMovieSkeletonTopology,
): ISnapshot {
  const conventions: Map<string, IConvention> = new Map();
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    skeletonJointAxes(skeleton, jointAxes);
  const fallbackAxes: IAutoMovieJointAxes =
    PoseResolutionSnapshot.axes(DEFAULT_JOINT_AXES);
  const fallback: IConvention =
    preparePoseJointResolution.convention(fallbackAxes);
  const copiedAxes: Map<string, IAutoMovieJointAxes> = new Map();
  for (const [name, basis] of PoseResolutionSnapshot.entries(axes))
    copiedAxes.set(name, PoseResolutionSnapshot.axes(basis));
  const copiedFrames: Map<string, IAutoMovieRestFrame> = new Map();
  for (const [name, frame] of PoseResolutionSnapshot.entries(restFrames))
    copiedFrames.set(name, PoseResolutionSnapshot.frame(frame));
  for (const [name, basis] of copiedAxes)
    conventions.set(
      name,
      preparePoseJointResolution.convention(basis, copiedFrames.get(name)),
    );
  for (const [name, frame] of copiedFrames)
    if (!copiedAxes.has(name))
      conventions.set(
        name,
        preparePoseJointResolution.convention(fallbackAxes, frame),
      );
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
  const preparedAxes: Readonly<
    Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
  > = Object.fromEntries(
    Array.from(
      conventions,
      ([name, convention]: [string, IConvention]): [
        string,
        IAutoMovieJointAxes,
      ] => [name, convention.axes],
    ),
  );
  return { nodes, indices, conventions, fallback, axes: preparedAxes };
}

/**
 * Runtime readers can reach only copied metadata, never the input-reading
 * scope.
 */
function bindSnapshot(snapshot: ISnapshot): prepareSkeletonPoseResolution.IRig {
  const { nodes, indices, conventions, fallback } = snapshot;

  // The state every read shares, and whether a read holds it.
  const shared: preparePoseResolutionState.IReader = preparePoseResolutionState(
    nodes,
    indices,
    conventions,
    fallback,
  );
  let lent: boolean = false;
  const rig: prepareSkeletonPoseResolution.IRig = {
    jointAxes: snapshot.axes,
    joint: (
      joint: IAutoMovieJointPose,
      operation?: ReturnType<typeof preparePoseResolution>,
    ): IAutoMovieQuaternion =>
      lend(
        operation,
        (reader: preparePoseResolutionState.IReader): IAutoMovieQuaternion =>
          reader.joint(joint),
      ),
    prepareTuples: (
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): prepareSkeletonPoseResolution.ITupleReader => {
      const demand: readonly number[] | undefined =
        requested === undefined
          ? undefined
          : preparePoseBoneDemand(indices, nodes.length, requested);
      const ancestors: ReadonlySet<AutoMovieHumanoidBone> | undefined =
        demand === undefined ? undefined : tupleAncestors(nodes, demand);
      return (
        joints: preparePoseTupleScan.IJoints,
      ): prepareSkeletonPoseResolution.ITupleRead => {
        const scan: preparePoseTupleScan.IScan = preparePoseTupleScan(
          joints,
          ancestors,
        );
        return (
          pose: Omit<IAutoMoviePose, "joints">,
          operation?: ReturnType<typeof preparePoseResolution>,
        ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          lend(
            operation,
            (
              reader: preparePoseResolutionState.IReader,
            ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
              reader.resolveTuples(scan, pose, demand),
          );
      };
    },
    preparePose: (
      pose: IAutoMoviePose,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
      operation?: ReturnType<typeof preparePoseResolution>,
    ): preparePoseResolutionState.IOverlayReader =>
      lend(
        operation,
        (
          reader: preparePoseResolutionState.IReader,
        ): preparePoseResolutionState.IOverlayReader =>
          reader.preparePose(pose, requested),
      ),
    prepareBones: (
      requested: ReadonlySet<AutoMovieHumanoidBone>,
    ): prepareSkeletonPoseResolution.IBoneDemand => {
      const demand: readonly number[] = preparePoseBoneDemand(
        indices,
        nodes.length,
        requested,
      );
      const names: ReadonlySet<AutoMovieHumanoidBone> = new Set(requested);
      return {
        resolve: (
          pose: IAutoMoviePose,
          operation?: ReturnType<typeof preparePoseResolution>,
        ): IAutoMovieResolvedBone[] =>
          lend(
            operation,
            (
              reader: preparePoseResolutionState.IReader,
            ): IAutoMovieResolvedBone[] =>
              reader.resolve(pose, undefined, demand),
          ),
        map: (
          pose: IAutoMoviePose,
          operation?: ReturnType<typeof preparePoseResolution>,
        ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          lend(
            operation,
            (
              reader: preparePoseResolutionState.IReader,
            ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
              reader.resolveMap(pose, undefined, demand),
          ),
        read: (
          reading: prepareSkeletonPoseResolution.IReading,
        ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          reading.map(names),
      };
    },
    read: (
      pose: IAutoMoviePose,
      operation?: ReturnType<typeof preparePoseResolution>,
    ): prepareSkeletonPoseResolution.IReading => {
      const read: preparePoseReading.IReading = lend(
        operation,
        (
          reader: preparePoseResolutionState.IReader,
        ): preparePoseReading.IReading => reader.read(pose),
      );
      // The frame reads take a row of the reading's own frames, which never
      // change once composed.
      const row: (index: number) => number = (index: number): number => {
        if (!(index >= 0 && index < read.names.length))
          throw new RangeError(`A reading has no bone row ${index}`);
        return index;
      };
      const reading: prepareSkeletonPoseResolution.IReading = {
        map: (
          requested?: ReadonlySet<AutoMovieHumanoidBone>,
        ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          read(requested),
        index: (bone: AutoMovieHumanoidBone): number =>
          read.indices.get(bone) ?? -1,
        position: (
          index: number,
          into: IAutoMovieVector3,
        ): IAutoMovieVector3 => {
          const at: number = 3 * row(index);
          const position: Float64Array = read.frames().position;
          into.x = position[at]!;
          into.y = position[at + 1]!;
          into.z = position[at + 2]!;
          return into;
        },
        rotation: (
          index: number,
          into: IAutoMovieQuaternion,
        ): IAutoMovieQuaternion => {
          const at: number = 4 * row(index);
          const rotation: Float64Array = read.frames().rotation;
          into.x = rotation[at]!;
          into.y = rotation[at + 1]!;
          into.z = rotation[at + 2]!;
          into.w = rotation[at + 3]!;
          return into;
        },
        bone: (index: number): IAutoMovieResolvedBone =>
          composePoseFrames.bone(read.names, read.frames(), row(index)),
      };
      return reading;
    },
    resolveMap: (
      pose: IAutoMoviePose,
      operation?: ReturnType<typeof preparePoseResolution>,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      lend(
        operation,
        (
          reader: preparePoseResolutionState.IReader,
        ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          reader.resolveMap(pose, requested),
      ),
    resolve: (
      pose: IAutoMoviePose,
      operation?: ReturnType<typeof preparePoseResolution>,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieResolvedBone[] => {
      return lend(
        operation,
        (
          reader: preparePoseResolutionState.IReader,
        ): IAutoMovieResolvedBone[] => reader.resolve(pose, requested),
      );
    },
  };
  return rig;

  /**
   * Run one read on the rig's own state, whatever operation it names: a state
   * is a function of the pose it admits and keeps only what it composed, every
   * read copies what it returns, and an overlay owns a state of its own after
   * its preparation, so one state serves every read of the rig. A state of each
   * operation's own admitted its first pose with nothing composed yet (a limb
   * fit's new operation composed every joint of a pose the assembly had just
   * composed). A read made while the state is lent (from inside another read's
   * admission) takes a state of its own. The operation stays in the readers'
   * signatures, which callers name; it selects nothing.
   */
  function lend<T>(
    _operation: ReturnType<typeof preparePoseResolution> | undefined,
    run: (reader: preparePoseResolutionState.IReader) => T,
  ): T {
    if (lent)
      return run(
        preparePoseResolutionState(nodes, indices, conventions, fallback),
      );
    lent = true;
    try {
      return run(shared);
    } finally {
      lent = false;
    }
  }
}

/**
 * Actual fixed outputs determine exactly which authored articulations can
 * affect them.
 */
function tupleAncestors(
  nodes: readonly INode[],
  demand: readonly number[],
): ReadonlySet<AutoMovieHumanoidBone> {
  const names: Set<AutoMovieHumanoidBone> = new Set();
  for (const output of demand) {
    let index: number = output;
    while (index >= 0) {
      const node: INode = nodes[index]!;
      if (names.has(node.name)) break;
      names.add(node.name);
      index = node.parent;
    }
  }
  return names;
}

/** Explicit immutable rig snapshot and its fresh-output demand resolver. */
export namespace prepareSkeletonPoseResolution {
  /**
   * Admit a complete source/root without computing unused output frames, only
   * through this factory's original own-data map callable. Unknown, copied,
   * proxied, inherited or replaced readers decline without invoking a
   * method/getter. A supported call performs the real ordered admission; its
   * failures propagate and no source-validity flag/result is retained.
   *
   * @param rig Genuine fixed rig whose original resolveMap data method is still
   *   installed.
   * @param pose Current complete source, with ordinary clinical degrees and
   *   root placement.
   * @param operation Same-operation dependency rows, when supplied.
   * @returns Whether actual factory admission ran; false requires the
   *   consumer's ordinary reader fallback.
   *
   *   Private factory registration and an equal own data-property value prove the
   *   exact map whose complete admission precedes sparse output demand. An
   *   empty name set omits unused FK frames while retaining every joint/root
   *   check. No boolean, structural match or frozen wrapper proves admission.
   *
   *   One weak lookup and descriptor check precede unchanged O(J) admission;
   *   unknown readers decline in constant work. Every supported call reads its
   *   current source; matching fixed-source consumers own completion reuse and
   *   raw fallback. The weak registration retains only the original callable;
   *   descriptor/empty-set temporaries end with this call, without a source
   *   verdict, result history, strong registry, handle or task. Speedup is
   *   unmeasured.
   */
  export function admitSource(
    rig: IRig,
    pose: IAutoMoviePose,
    operation?: ReturnType<typeof preparePoseResolution>,
  ): boolean {
    rig.resolveMap(pose, operation, new Set<AutoMovieHumanoidBone>());
    return true;
  }

  /**
   * Root construction after tuple staging
   * (`IAutoMovieSkeletonPoseResolution.ITupleRead`).
   */
  export type ITupleRead = IAutoMovieSkeletonPoseResolution.ITupleRead;

  /** Staged tuple reader (`IAutoMovieSkeletonPoseResolution.ITupleReader`). */
  export type ITupleReader = IAutoMovieSkeletonPoseResolution.ITupleReader;

  /**
   * Return fresh geometric rest frames only from this owner's genuine rig.
   * Private weak provenance resolves the actual immutable rooted nodes,
   * independently of public method replacement. Unknown structural rigs throw
   * before any method is invoked. No external rest map or skeleton pairing is
   * accepted. The original root-null, no-joint/no-scale FK produces lazy rest
   * once and shares it with ordinary neutral reads, preserving all arithmetic
   * grouping. Each O(B) output copy is fresh; private rows live with the rig,
   * without an operation key, pose, authored callback, output history or strong
   * registry.
   */
  export function rest(rig: IRig): IAutoMovieResolvedBone[] {
    return rig.resolve({ skeleton: "", root: null, joints: [] });
  }

  /**
   * Immutable prepared FK of one fixed rig
   * (`IAutoMovieSkeletonPoseResolution.IRig`).
   */
  export type IRig = IAutoMovieSkeletonPoseResolution.IRig;

  /**
   * One pose as this rig admitted it
   * (`IAutoMovieSkeletonPoseResolution.IReading`).
   */
  export type IReading = IAutoMovieSkeletonPoseResolution.IReading;

  /**
   * A rig's fixed requested-bone snapshot
   * (`IAutoMovieSkeletonPoseResolution.IBoneDemand`).
   */
  export type IBoneDemand = IAutoMovieSkeletonPoseResolution.IBoneDemand;
}
