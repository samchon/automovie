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
import { preparePoseBoneDemand } from "./preparePoseBoneDemand";
import type { preparePoseReading } from "./preparePoseReading";
import { preparePoseTupleScan } from "./preparePoseTupleScan";
import { PoseResolutionSnapshot } from "./PoseResolutionSnapshot";
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

/** Genuine rig provenance lends only private-node rest production, never public methods. */
const REST_READERS: WeakMap<prepareSkeletonPoseResolution.IRig, () => IAutoMovieResolvedBone[]> =
  new WeakMap();

/** Genuine original map callables prove this factory's complete-before-demand admission. */
const SOURCE_READERS: WeakMap<prepareSkeletonPoseResolution.IRig,
  prepareSkeletonPoseResolution.IRig["resolveMap"]> = new WeakMap();

/** A reading's rig and its private reader, which also takes the rig's bound indices. */
interface IOwnReading {
  /** The rig that admitted the pose. */
  rig: prepareSkeletonPoseResolution.IRig;

  /** The admission's bones by names or by bound indices. */
  read: preparePoseReading.IReading;
}

/** Each issued reading's private reader; a structural copy of a reading has none. */
const READINGS: WeakMap<prepareSkeletonPoseResolution.IReading, IOwnReading> = new WeakMap();

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
 * @evidence contracts/development/common.md#meaningful-documentation Defines snapshot invalidation, pose/joint/source admission, demands, no-scale grouping and fresh outputs. Companions state genuine rest refusal/ownership and two-phase authored tuple snapshot/root/admission order with fresh maps.
 * @evidence contracts/development/implementation.md#principled-implementation Existing skeletonJointAxes merging remains authoritative; its effective own/custom-prototype mappings and rest frames snapshot direct lookup, including non-enumerable fields and undefined shadowing. Immutable rest data defines actual DFS subtree intervals. Final articulation changes revise affected descendants, and exact root tuples retain ordinary Hamilton grouping. Basis/frame admission remains lazy at actual use. Companion admitSource verifies the privately registered original own-data map callable, whose complete admitPose phase precedes empty output demand.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure snapshotRig copies static inputs in a scope with no returned reader; bindSnapshot closes only over that owned result. Array/map outputs share one admission and sparse-FK owner with private static output writers. preparePoseTupleScan stages entries/scalars before root work and delegates to that same owner. admitSource owns native method provenance and delegates real validation to the ordinary map; prepareChainFit owns source lifetime and raw fallback. No target/fit policy enters this producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose/time identity, tolerance or result flag certifies equivalence. All authored records keep finite admission/last precedence, missing articulation is identity and unreachable demands remain absent. Rest accepts only actual factory provenance, no external map/skeleton pair or public-method assertion. admitSource declines unknown rigs before descriptor observation and replaced/accessor/inherited methods without invoking getters; no boolean, structural match or frozen wrapper replaces numerical admission. Raw resolvePose remains live.
 * @evidence contracts/development/implementation.md#efficient-algorithms Static setup is linear in bones/mappings. Fixed tuple names bind their D ancestors once. All J tuples retain admission, one 4J name/F/A/T array replaces J records and releases entry pairs before root work, and only changed ancestor articulations compose. Out-of-scope old selections invalidate conservatively before a future demand repopulates actual values. Changes revise observed frames; K fresh copies/inserts remain, with map reads avoiding a temporary FK array. Fixed sources admit baseline once then E edits. admitSource uses a weak lookup and one own-descriptor check before unchanged O(J) admission with empty FK demand; unknown readers decline in constant work. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Owned static data and actual neutral FK serve both ordinary reads and genuine mass-model rest production. Private rest provenance cannot invoke a replaced public method or borrow foreign frames. Every read, whatever operation it names, shares the rig's one state (a state is a function of the pose it admits and every output is a copy), so a joint tuple the state converted before is not converted again; a read nested in another's admission takes a fresh state. Actual fixed-source admission produces separate overlays whose missing edits restore baseline. admitSource shares only the registered callable and immutable rig prerequisites; each supported call admits current source data, while successful-completion reuse belongs to the matching fixed-source consumer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Rig data and the one shared state cost O(B+A+F) and O(U+B) for the rig's lifetime; rest/source provenance remains weak and source registration retains only the original factory callable. Runtime closures are created outside the input-reading scope, receiving only owned snapshots, so original skeleton/topology/tables are not retained by a shared constructor scope. Fixed demands hold K indices and tuple demands additionally D ancestor names. Fixed sources own O(B+U) rows. Tuple queries hold 4J copied name/coordinate slots until release, with no current entries/root/operation/result history entering their bound factory. admitSource's descriptor and empty name set are call-local; no source verdict, strong registry, handle or task is retained.
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
  jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> | undefined,
  restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> | undefined,
  topology: IAutoMovieSkeletonTopology,
): ISnapshot {
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
  const preparedAxes: Readonly<Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>> =
    Object.freeze(Object.fromEntries(Array.from(conventions,
      ([name, convention]: [string, IConvention]): [string, IAutoMovieJointAxes] =>
        [name, convention.axes],
    )));
  return { nodes, indices, conventions, fallback, axes: preparedAxes };
}

/** Runtime readers can reach only copied metadata, never the input-reading scope. */
function bindSnapshot(snapshot: ISnapshot): prepareSkeletonPoseResolution.IRig {
  const { nodes, indices, conventions, fallback } = snapshot;

  // The state every read shares, and whether a read holds it.
  let shared: preparePoseResolutionState.IReader | undefined;
  let lent: boolean = false;
  const rig: prepareSkeletonPoseResolution.IRig = {
    jointAxes: snapshot.axes,
    joint: (joint: IAutoMovieJointPose, operation?: ReturnType<typeof preparePoseResolution>): IAutoMovieQuaternion =>
      lend(operation, (reader: preparePoseResolutionState.IReader): IAutoMovieQuaternion => reader.joint(joint)),
    prepareTuples: (requested?: ReadonlySet<AutoMovieHumanoidBone>): prepareSkeletonPoseResolution.ITupleReader => {
      const demand: readonly number[] | undefined = requested === undefined ? undefined
        : preparePoseBoneDemand(indices, nodes.length, requested);
      const ancestors: ReadonlySet<AutoMovieHumanoidBone> | undefined = demand === undefined
        ? undefined : tupleAncestors(nodes, demand);
      return (joints: preparePoseTupleScan.IJoints): prepareSkeletonPoseResolution.ITupleRead => {
        const scan: preparePoseTupleScan.IScan = preparePoseTupleScan(joints, ancestors);
        return (pose: Omit<IAutoMoviePose, "joints">, operation?: ReturnType<typeof preparePoseResolution>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          lend(operation, (reader: preparePoseResolutionState.IReader): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
            reader.resolveTuples(scan, pose, demand));
      };
    },
    preparePose: (pose: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>, operation?: ReturnType<typeof preparePoseResolution>): preparePoseResolutionState.IOverlayReader =>
      lend(operation, (reader: preparePoseResolutionState.IReader): preparePoseResolutionState.IOverlayReader =>
        reader.preparePose(pose, requested)),
    prepareBones: (requested: ReadonlySet<AutoMovieHumanoidBone>): prepareSkeletonPoseResolution.IBoneDemand => {
      const demand: readonly number[] = preparePoseBoneDemand(indices, nodes.length, requested);
      return {
        resolve: (pose: IAutoMoviePose, operation?: ReturnType<typeof preparePoseResolution>): IAutoMovieResolvedBone[] =>
          lend(operation, (reader: preparePoseResolutionState.IReader): IAutoMovieResolvedBone[] =>
            reader.resolve(pose, undefined, demand)),
        map: (pose: IAutoMoviePose, operation?: ReturnType<typeof preparePoseResolution>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          lend(operation, (reader: preparePoseResolutionState.IReader): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
            reader.resolveMap(pose, undefined, demand)),
        read: (reading: prepareSkeletonPoseResolution.IReading): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
          const own: IOwnReading | undefined = READINGS.get(reading);
          if (own === undefined || own.rig !== rig)
            throw new Error("A bone demand reads only a pose reading of its own rig");
          return own.read(undefined, demand);
        },
      };
    },
    read: (pose: IAutoMoviePose, operation?: ReturnType<typeof preparePoseResolution>): prepareSkeletonPoseResolution.IReading => {
      const read: preparePoseReading.IReading = lend(operation,
        (reader: preparePoseResolutionState.IReader): preparePoseReading.IReading => reader.read(pose));
      const reading: prepareSkeletonPoseResolution.IReading = {
        map: (requested?: ReadonlySet<AutoMovieHumanoidBone>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          read(requested),
      };
      READINGS.set(reading, { rig, read });
      return reading;
    },
    resolveMap: (pose: IAutoMoviePose, operation?: ReturnType<typeof preparePoseResolution>,
      requested?: ReadonlySet<AutoMovieHumanoidBone>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      lend(operation, (reader: preparePoseResolutionState.IReader): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        reader.resolveMap(pose, requested)),
    resolve: (
      pose: IAutoMoviePose,
      operation?: ReturnType<typeof preparePoseResolution>,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieResolvedBone[] => {
      return lend(operation, (reader: preparePoseResolutionState.IReader): IAutoMovieResolvedBone[] =>
        reader.resolve(pose, requested));
    },
  };
  REST_READERS.set(rig, (): IAutoMovieResolvedBone[] =>
    preparePoseResolutionState.rest(nodes));
  SOURCE_READERS.set(rig, rig.resolveMap);
  return rig;

  /**
   * Run one read on the rig's own state, whatever operation it names: a
   * state is a function of the pose it admits and keeps only what it
   * composed, every read copies what it returns, and an overlay owns a
   * state of its own after its preparation, so one state serves every read
   * of the rig. A state of each operation's own admitted its first pose
   * with nothing composed yet (a limb fit's new operation composed every
   * joint of a pose the assembly had just composed). A read made while the
   * state is lent (from inside another read's admission) takes a state of
   * its own. The operation stays in the readers' signatures, which callers
   * name; it selects nothing.
   */
  function lend<T>(_operation: ReturnType<typeof preparePoseResolution> | undefined,
    run: (reader: preparePoseResolutionState.IReader) => T): T {
    if (lent) return run(preparePoseResolutionState(nodes, indices, conventions, fallback));
    lent = true;
    try {
      return run(shared ??= preparePoseResolutionState(nodes, indices, conventions, fallback));
    } finally {
      lent = false;
    }
  }
}

/** Actual fixed outputs determine exactly which authored articulations can affect them. */
function tupleAncestors(nodes: readonly INode[], demand: readonly number[]): ReadonlySet<AutoMovieHumanoidBone> {
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

/**
 * Explicit immutable rig snapshot and its fresh-output demand resolver.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States snapshot/operation ownership, pose/demand/source semantics, genuine private rest and original-data-method source admission. Foreign/replaced readers decline without invoking getters, and ordinary output ownership remains fresh.
 * @evidence contracts/development/design.md#principled-representation IRig couples an immutable rooted rest graph and raw clinical snapshot to actual individual-joint admission, complete poses, fixed sources and fixed demands. IBoneDemand fixes reachable output membership/order; poses retain clinical degrees and model-metre placement. Producer/runtime owners retain axis, angle and graph admission, without type-only finiteness claims.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Body/chain consumers use ordinary joint/pose reads, flight fixed demands and digits fixed sources. HumanTrunk uses staged tuples, mass uses genuine private rest, and prepared continuation uses actual source admission with no unused FK output. Existing quantities and private numeric rows remain authoritative.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene, fixed body subset, editable whitelist, trusted boolean or user-constructible admitted-rest record replaces actual admission. The genuine producer snapshots its inputs; every ordinary pose or overlay query retains its stated validation and every public transform is fresh.
 */
export namespace prepareSkeletonPoseResolution {
  /**
   * Admit a complete source/root without computing unused output frames,
   * only through this factory's original own-data map callable. Unknown,
   * copied, proxied, inherited or replaced readers decline without invoking
   * a method/getter. A supported call performs the real ordered admission;
   * its failures propagate and no source-validity flag/result is retained.
   *
   * @param rig Genuine fixed rig whose original resolveMap data method is still installed.
   * @param pose Current complete source, with ordinary clinical degrees and root placement.
   * @param operation Same-operation dependency rows, when supplied.
   * @returns Whether actual factory admission ran; false requires the consumer's ordinary reader fallback.
   *
   * Private factory registration and an equal own data-property value prove
   * the exact map whose complete admission precedes sparse output demand.
   * An empty name set omits unused FK frames while retaining every joint/root
   * check. No boolean, structural match or frozen wrapper proves admission.
   *
   * One weak lookup and descriptor check precede unchanged O(J) admission;
   * unknown readers decline in constant work. Every supported call reads its
   * current source; matching fixed-source consumers own completion reuse and
   * raw fallback. The weak registration retains only the original callable;
   * descriptor/empty-set temporaries end with this call, without a source
   * verdict, result history, strong registry, handle or task. Speedup is
   * unmeasured.
   */
  export function admitSource(rig: IRig, pose: IAutoMoviePose,
    operation?: ReturnType<typeof preparePoseResolution>): boolean {
    const read: IRig["resolveMap"] | undefined = SOURCE_READERS.get(rig);
    if (read === undefined) return false;
    const descriptor: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(rig, "resolveMap");
    if (descriptor === undefined || !("value" in descriptor) ||
      descriptor.value !== read) return false;
    read(pose, operation, new Set<AutoMovieHumanoidBone>());
    return true;
  }

  /** Root construction occurs after tuple staging, before actual ordered numerical admission. */
  export type ITupleRead = (pose: Omit<IAutoMoviePose, "joints">,
    operation?: ReturnType<typeof preparePoseResolution>) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /** Snapshot all current authored entries/scalars, without constructing intermediate joint records. */
  export type ITupleReader = (joints: preparePoseTupleScan.IJoints) => ITupleRead;

  /**
   * Return fresh geometric rest frames only from this owner's genuine rig.
   * Private weak provenance resolves the actual immutable rooted nodes,
   * independently of public method replacement. Unknown structural rigs throw
   * before any method is invoked. No external rest map or skeleton pairing is
   * accepted. The original root-null, no-joint/no-scale FK produces lazy rest
   * once and shares it with ordinary neutral reads, preserving all arithmetic
   * grouping. Each O(B) output copy is fresh; private rows live with the rig,
   * without an operation key, pose, authored callback, output history or strong registry.
   */
  export function rest(rig: IRig): IAutoMovieResolvedBone[] {
    const read: (() => IAutoMovieResolvedBone[]) | undefined = REST_READERS.get(rig);
    if (read === undefined)
      throw new Error("Rest FK requires a rig produced by prepareSkeletonPoseResolution");
    return read();
  }

  /**
   * Immutable prepared FK, independent of later source rig or table edits.
   *
   * Complete poses use current clinical degrees/root placement; fixed-source
   * queries append complete edits to an actually admitted source. Fixed demand
   * selects reachable outputs without exposing numeric indices or state rows.
   */
  export interface IRig {
    /**
     * Bind fixed output names, then stage each current tuple map before root
     * construction. The returned root reader admits all staged scalars through
     * the same actual F/A/T basis/frame/finite owner and sparse FK. All entries
     * snapshot before tuple components; all components read before root work,
     * preserving explicit undefined/getter failure order and fresh outputs.
     * Fixed ancestry omits only pure composition outside that graph closure;
     * every scalar still receives original basis/finite/used-frame checks.
     * One 4J name/scalar array replaces J joint records. Fixed names live with the
     * factory; each staged scan ends with its synchronous query and retains no
     * source tuples/map, root, operation reader or result history.
     */
    prepareTuples(requested?: ReadonlySet<AutoMovieHumanoidBone>): ITupleReader;

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

    /**
     * Admit a complete pose in its records' order once, as resolve does, and
     * return it as a reading: a value its producer hands to every consumer of
     * that pose's bones. Reading bones from it admits nothing again and
     * composes each demanded bone at most once across all its readers, by
     * the same parent-first products as resolve. It holds the admitted
     * articulations and root, not the records, so a later edit of the pose
     * needs a new reading. One O(J) admission, then K fresh copies a read;
     * the reading keeps B references and at most B private frames until its
     * holder releases it.
     */
    read(pose: IAutoMoviePose, operation?: ReturnType<typeof preparePoseResolution>): IReading;

    /** Immutable merged raw-axis snapshot for the same rig's IK; normalization remains lazy at each original use site. */
    readonly jointAxes: Readonly<Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>>;

    /**
     * Complete current ordered admission and the same sparse parent-first FK
     * as resolve, directly into a fresh name map. Each bone/nested transform
     * is copied once; later duplicate names retain Map's original insertion
     * order and last value. Optional live names select only actual rooted
     * outputs without relaxing any clinical check. Private output writers
     * accept no foreign callback or caller-supplied container. Work remains
     * current admission/changes/invalidated ancestry plus K copies/inserts,
     * without an intermediate FK array. Only the same weak operation rows
     * persist; the map and every nested value belong solely to the caller.
     */
    resolveMap(pose: IAutoMoviePose, operation?: ReturnType<typeof preparePoseResolution>,
      requested?: ReadonlySet<AutoMovieHumanoidBone>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

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
   * One pose as this rig admitted it, handed by the pose's producer to the
   * readers of its bones.
   */
  export interface IReading {
    /** The requested reachable bones in parent-first order, all of them when no names are given, as a fresh map of fresh frames. */
    map(requested?: ReadonlySet<AutoMovieHumanoidBone>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * A genuine immutable rig's fixed requested-bone snapshot.
   *
   * Actual rig name lookup fixes reachable output membership/order. Queries
   * supply complete current poses; numeric indices and state stay private.
   */
  export interface IBoneDemand {
    /** The captured bones of a pose this rig already admitted (`IRig.read`), fresh, without sorting names or admitting again; a reading of another rig or a copied one throws. */
    read(reading: IReading): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * The same full admission, fixed rooted demand, exact invalidation and
     * fresh nested ownership as resolve, written directly into a fresh map
     * without an intermediate result array. Private writers share the FK
     * recurrence and admit no external callback or validity flag. Queries
     * retain no container/result history; bounded dynamic rows end with the
     * same lent operation, while the caller owns all returned map values.
     */
    map(pose: IAutoMoviePose, operation?: ReturnType<typeof preparePoseResolution>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

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

