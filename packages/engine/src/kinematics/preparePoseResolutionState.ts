import type {
  AutoMovieHumanoidBone, IAutoMovieJointPose,
  IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { PoseResolutionSnapshot } from "./PoseResolutionSnapshot";
import { resolvePreparedPoseFrame } from "./resolvePreparedPoseFrame";
import { preparePoseBoneDemand } from "./preparePoseBoneDemand";
import { preparePoseReading } from "./preparePoseReading";
import { preparePoseResolutionChanges } from "./preparePoseResolutionChanges";
import { preparePoseJointResolution } from "./preparePoseJointResolution";
import { preparePosePlacement } from "./preparePosePlacement";
import type { preparePoseTupleScan } from "./preparePoseTupleScan";

/** The immutable rooted node representation owned by this state producer. */
type INode = preparePoseResolutionState.INode;

/** The static clinical convention shared by this rig's operation states. */
type IConvention = preparePoseResolutionState.IConvention;

/** A bone's exact local, root-relative and optionally placed dependency rows. */
interface IFrameReading {
  /** Last invocation that checked the selected articulation. */
  epoch: number;

  /** Last selected articulation scalars, isolated from authored records. */
  articulation: IAutoMovieQuaternion;

  /** Rest times articulation; independent of ancestor and root placement. */
  localRotation: IAutoMovieQuaternion;

  /** Revision advanced only when the local rotation's exact inputs change. */
  localRevision: number;

  /** Root-relative FK is computed only when a root-null call demands it. */
  relative?: IWorldReading;

  /** Optional placed result, with its exact root and ancestor dependency row. */
  placed?: IWorldReading & { rootRevision: number };
}

/** One completed placement and its exact local/ancestor dependency revisions. */
interface IWorldReading extends resolvePreparedPoseFrame.IReading {
  /** Local quaternion revision used by this placement. */
  localRevision: number;

  /** Parent frame revision used by this placement. */
  parentRevision: number;

  /** Revision advanced after a changed placement dependency. */
  revision: number;

  /** Actual completed articulation change on this node's ancestry. */
  articulationRevision: number;
}

/** Dynamic FK rows belong to one live operation reader, never to pose identity. */
interface IState {
  /** Actual final selections and affected-subtree revisions from admitted records. */
  changes: preparePoseResolutionChanges.ITracker;

  /** Invocation counter used for sparse joint removal and per-call traversal. */
  epoch: number;

  /** Ordered joint admission and successful current scalar/composition rows. */
  joints: preparePoseJointResolution.IReader;

  /** Sparse lazily demanded bone rows, indexed by the immutable rig. */
  frames: (IFrameReading | undefined)[];

  /** Private immutable root quaternion, reused only while actual scalars match. */
  rootRotation: IAutoMovieQuaternion;

  /** Private immutable root translation, separate from root rotation changes. */
  rootTranslation: IAutoMovieVector3;

  /** Revision of that exact root tuple. */
  rootRevision: number;
}

/** Private identity operands; no returned transform aliases them. */
const IDENTITY: IAutoMovieQuaternion = Object.freeze(Quaternion.identity());

/** Private root-relative origin. */
const ORIGIN: IAutoMovieVector3 = Object.freeze(Vector3.create());

/**
 * Own sparse dynamic FK rows on one immutable prepared rig.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines immutable graph/conventions, joint/pose/fixed-source and staged-tuple admission, fixed demand, genuine rest, metre frames, phase ordering and fresh-output/operation lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Record poses compose admitted joints through parent-first FK. Fixed tuple scans validate all values and compose genuine requested ancestry only; omitted old selections invalidate prior rows, and future queries repopulate from actual admission. Fixed sources snapshot before overlays. Genuine rest uses immutable nodes, identity articulation and root-null operands through the same physical owner, retaining raw grouping/no scale.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Static construction, tuple staging, joint admission and final changes have their own owners. Record and genuine scalar scans meet at the same changes/root/sparse-FK phases here. Private static array/map writers receive the common frame owner's fresh copies; no foreign sink enters traversal. restFrameOf alone computes neutral geometry for ordinary rest and mass production.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Ordinary reads admit every current record, fixed-source production admits every baseline record and every query admits all supplied edits, including overwritten/stray records. No target, time, tolerance, editable whitelist or external admission flag certifies a result; numeric demands come only from the same immutable rig's name lookup.
 * @evidence contracts/development/implementation.md#efficient-algorithms Complete poses admit J records/compare membership; changes sort only after observation and revise affected observed frames. The tracker owns bounded insertion/sparse lookup. K names sort unless bound; full demand walks B indices directly. Invalidated ancestry precedes K copies; map reads allocate no temporary frame array and world metadata updates allocate no assignment objects. Fixed sources admit baseline once then E edits. Rest lazily computes static neutral once, then copies B frames without operation rows. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Static nodes lazily keep actual rest-times-identity and neutral root-relative computations. Neutral reuse requires that exact local quaternion and actual static parent's private rotation/position references; static rows retain no operation frame. Operation rows share exact dynamic dependencies. A reading (preparePoseReading) takes one completed admission's articulations and root as a value, so the readers its producer hands it to share its frames without another admission. Fixed-source production admits baseline/current membership before independent overlay snapshots; all changed/removed joints, edits and roots remain visible.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Ordinary operation rows and fixed-source baseline/overlay/frame data cost O(U+B) until release. Bound demands retain K indices without a reader/pose/source set. Actual static neutral rows belong to the rig, while every rest output is a fresh caller-owned copy with no operation key or result history. No task or handle is created.
 */
export function preparePoseResolutionState(
  nodes: readonly INode[],
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  conventions: ReadonlyMap<string, IConvention>,
  fallback: IConvention,
): preparePoseResolutionState.IReader {
  const state: IState = createState(nodes, indices, conventions, fallback);
  return {
    joint: (joint: IAutoMovieJointPose): IAutoMovieQuaternion => ({ ...state.joints.admit(joint) }),
    preparePose: (source: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>): preparePoseResolutionState.IOverlayReader =>
      preparePoseResolutionState.preparePose(nodes, indices, conventions, fallback, source, requested, state),
    resolve: (pose: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>, demand?: readonly number[]): IAutoMovieResolvedBone[] =>
      readFrames(nodes, indices, admitPose(state, pose), [], appendArray, requested, demand),
    resolveMap: (pose: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>, demand?: readonly number[]): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      readFrames(nodes, indices, admitPose(state, pose), new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>(), appendMap, requested, demand),
    read: (pose: IAutoMoviePose): preparePoseReading.IReading =>
      preparePoseReading(nodes, indices, admitPose(state, pose)),
    resolveTuples: (scan: preparePoseTupleScan.IScan, pose: Omit<IAutoMoviePose, "joints">,
      demand?: readonly number[]): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      ++state.epoch;
      state.joints.begin();
      scan(state.joints);
      state.changes.complete();
      preparePosePlacement(state, pose, IDENTITY, ORIGIN);
      return readFrames(nodes, indices, state, new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>(), appendMap, undefined, demand);
    },
  };
}

/**
 * Internal immutable rig inputs and actual dynamic-reader producer contracts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines static input ownership and ordinary versus fixed-source reader semantics.
 * @evidence contracts/development/design.md#principled-representation INode owns one rooted parent index, actual exclusive DFS subtree end, metre rest offset/quaternion and lazy actual identity-local/neutral-root-relative results. IConvention owns fixed raw axes/optional degree frames plus successful fixed basis/scalar preparation. Complete-pose and fixed-source readers retain actual numerical admission; types do not certify external records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Body/flight/digit consumers need complete poses, fixed sources/demands and joint admission. The genuine authored tuple producer supplies staged scalar scans without intermediate records; private rest supplies mass without external frame injection. Existing numeric types remain authoritative and no private row escapes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene, fixed body shape, editable whitelist, target answer, pose-identity cache or caller-set admission certificate is represented. Missing/unreachable bone handling stays with rooted FK, and actual supplied records still receive their stated admission.
 */
export namespace preparePoseResolutionState {
/**
 * Immutable rest data and the parent-first index of one reachable bone.
 *
 * The static producer numbers rooted bones in traversal order; -1 is a
 * null-parent root. Rest offsets use parent-frame metres and rotations retain
 * their exact quaternion components. No pose or rig-specific case is stored.
 */
export interface INode {
  /** Original name, preserved in outputs and joint lookup. */
  name: AutoMovieHumanoidBone;

  /** Parent index, or -1 for a null-parent root. */
  parent: number;

  /** Exclusive end of this actual depth-first rooted subtree. */
  subtreeEnd: number;

  /** Snapshot of the parent-frame rest translation in metres. */
  translation: IAutoMovieVector3;

  /** Snapshot of the parent-frame rest rotation; scale remains unused. */
  rotation: IAutoMovieQuaternion;

  /** Actual rest-times-identity result, lazily computed once on this immutable node. */
  identityLocalRotation?: IAutoMovieQuaternion;

  /** Actual neutral root-relative computation, borrowing only static ancestor operands. */
  restFrame?: resolvePreparedPoseFrame.IReading;
}

/**
 * Immutable clinical inputs and their lazy successful basis admission.
 *
 * Fixed raw axes and optional affine degree frames define clinical reading.
 * The first actual authored use admits the basis; an unused malformed mapping
 * stays unadmitted. No external record or source pose is certified here.
 */
export type IConvention = preparePoseJointResolution.IConvention;

  /**
   * Fresh-output FK of complete changing poses on the same immutable rig.
   *
   * The pose supplies clinical degrees/root placement and optional demand
   * selects model-metre outputs. Only exact current dependency rows remain
   * private; no revision, source pose or target answer escapes.
   */
  export interface IReader {
    /**
     * Actually admit one current joint on the same static convention, sharing
     * only successful exact conversion and returning a fresh quaternion. This
     * constant-size read completes no pose/membership selection or FK; later
     * complete poses still admit every record and invalidate real changes.
     * Private successful rows remain with this operation, without raw inputs.
     */
    joint(joint: IAutoMovieJointPose): IAutoMovieQuaternion;

    /**
     * Actually admit and snapshot a fixed source/root once, with optional bound
     * names. The shared producer reuses only exact completed joint conversion
     * from this operation; it never presumes source admission. O(J+B) baseline
     * preparation creates an independent O(B+U) overlay workspace, released
     * with that source operation, without retaining this reader or source pose.
     */
    preparePose(source: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>): IOverlayReader;

    /**
     * Admit every complete-pose record in order, then resolve requested rooted
     * frames through the common recurrence and fresh-output copier. Internal
     * demand indices come only from this rig's actual name-demand producer.
     * Current admission, actual changed-subtree revisions and invalidated
     * ancestry precede K copies and optional live-name sorting. Exact current
     * rows remain with this operation and no input/result is retained.
     */
    resolve(pose: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>, demand?: readonly number[]): IAutoMovieResolvedBone[];

    /**
     * Same complete ordered admission/root phases, private sparse FK and
     * exact invalidation as resolve, directly into a fresh name map. Static
     * internal writers share the frame copier without a foreign callback or
     * caller container. Current admission/changed ancestry and K fresh copies
     * remain; no temporary frame array is allocated. Weak operation rows keep
     * only current dependencies; callers own the map and all nested values.
     */
    resolveMap(pose: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>, demand?: readonly number[]): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** Admit a complete pose in order once and return its articulations and root as a reading whose bones any number of readers take without another admission; later edits of the pose do not reach it. */
    read(pose: IAutoMoviePose): preparePoseReading.IReading;

    /** Admit every genuinely staged scalar after root construction, then use ordinary sparse FK/fresh copies. */
    resolveTuples(scan: preparePoseTupleScan.IScan, pose: Omit<IAutoMoviePose, "joints">,
      demand?: readonly number[]): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * A genuine admitted fixed source with complete appended edits for each query.
   *
   * A query means the fixed source joint array followed by this query's edits,
   * with later records winning and absent edits restoring the baseline. The
   * producer actually admits the source; arbitrary bone edits stay supported.
   */
  export interface IOverlayReader {
    /**
     * Same ordered edit admission, baseline restoration and sparse FK as
     * resolve, directly into a fresh name map. Private output writers accept
     * no external callback/validity flag; E edits/changed ancestry and K copies
     * remain without a frame array. Exact rows share this workspace only;
     * callers own every nested value and no query history is retained.
     */
    resolveMap(edits: readonly IAutoMovieJointPose[], requested?: ReadonlySet<AutoMovieHumanoidBone>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * Admit all current edits in order, including overwritten/stray records,
     * then resolve baseline plus those edits through the same sparse FK.
     * Optional live names override bound demand. E edits, actual changed-
     * subtree revisions and invalidated ancestry precede K fresh copies and
     * optional override sorting, sharing exact local/ancestor work while
     * O(B+U) baseline/overlay rows end with this workspace, never query history.
     */
    resolve(edits: readonly IAutoMovieJointPose[], requested?: ReadonlySet<AutoMovieHumanoidBone>): IAutoMovieResolvedBone[];
  }

  /**
   * Admit one fixed source and own exact FK updates for appended query edits.
   *
   * Ordinary ordered admission produces the last source articulation per bone;
   * current membership is filtered before snapshotting, even with a borrowed
   * same-rig admission state. Each query admits its complete appended edits and
   * missing edits select baseline, through the unchanged parent-first FK.
   * Source work is O(J+B) once; queries admit E edits, revise actual changed
   * subtrees and check invalidated ancestry before fresh demanded copies.
   * Release the independent O(B+U) workspace with the source operation; source
   * edits require a new producer and no pose or query-result history is kept.
   */
  export function preparePose(
    nodes: readonly INode[],
    indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
    conventions: ReadonlyMap<string, IConvention>,
    fallback: IConvention,
    source: IAutoMoviePose,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    admission?: IState,
  ): IOverlayReader {
    const baseline: IState = admission ?? createState(nodes, indices, conventions, fallback);
    ++baseline.epoch;
    baseline.joints.begin();
    for (const joint of source.joints) baseline.joints.admit(joint);
    const state: IState = createState(nodes, indices, conventions, fallback, baseline.joints.snapshot());
    preparePosePlacement(state, source, IDENTITY, ORIGIN);
    const demanded: readonly number[] | undefined = requested === undefined
      ? undefined : preparePoseBoneDemand(indices, nodes.length, requested);
    return {
      resolve: (edits: readonly IAutoMovieJointPose[], requested?: ReadonlySet<AutoMovieHumanoidBone>): IAutoMovieResolvedBone[] => {
        admitEdits(state, edits);
        return readFrames(nodes, indices, state, [], appendArray, requested,
          requested === undefined ? demanded : undefined);
      },
      resolveMap: (edits: readonly IAutoMovieJointPose[], requested?: ReadonlySet<AutoMovieHumanoidBone>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
        admitEdits(state, edits);
        return readFrames(nodes, indices, state, new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>(), appendMap, requested,
          requested === undefined ? demanded : undefined);
      },
    };
  }

  /**
   * Read genuine geometric rest from this producer's immutable rooted nodes.
   * No articulation or clinical frame is admitted: this is exactly root-null
   * FK with no authored joints. The shared restFrameOf owner keeps original
   * rest-times-identity and parent-first products/vector sums. First use costs
   * O(B) actual FK, later reads only copy B fresh outputs; static rows stay
   * with the rig and no operation, source pose or output array is retained.
   */
  export function rest(nodes: readonly INode[]): IAutoMovieResolvedBone[] {
    const result: IAutoMovieResolvedBone[] = [];
    for (let index: number = 0; index < nodes.length; ++index)
      result.push(resolvePreparedPoseFrame.copy(restFrameOf(nodes, index).frame));
    return result;
  }
}

/** Allocate only current exact dependency rows, without retaining any authored input. */
function createState(
  nodes: readonly INode[], indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  conventions: ReadonlyMap<string, IConvention>, fallback: IConvention,
  baseline?: readonly (IAutoMovieQuaternion | undefined)[],
): IState {
  const changes: preparePoseResolutionChanges.ITracker = preparePoseResolutionChanges(nodes, IDENTITY, baseline);
  return { epoch: 0, changes,
    joints: preparePoseJointResolution(indices, conventions, fallback, changes), frames: [],
    rootRotation: IDENTITY, rootTranslation: ORIGIN, rootRevision: 0 };
}

/** Both output representations begin with the same original ordered admission/root phases. */
function admitPose(state: IState, pose: IAutoMoviePose): IState {
  admitEdits(state, pose.joints);
  preparePosePlacement(state, pose, IDENTITY, ORIGIN);
  return state;
}

/** Complete every current appended edit before either output representation reads FK. */
function admitEdits(state: IState, edits: readonly IAutoMovieJointPose[]): void {
  ++state.epoch;
  state.joints.begin();
  for (const joint of edits) state.joints.admit(joint);
  state.changes.complete();
}

/** Select parent-first output indices and visit only their actual ancestor closure. */
function readFrames<T extends IAutoMovieResolvedBone[] | Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>>(
  nodes: readonly INode[], indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  state: IState, result: T, append: (result: T, frame: IAutoMovieResolvedBone) => void,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
  fixedDemand?: readonly number[],
): T {
  const demanded: readonly number[] | undefined = fixedDemand ?? (requested === undefined
    ? undefined : preparePoseBoneDemand(indices, nodes.length, requested));
  const count: number = demanded?.length ?? nodes.length;
  const rootRelative: boolean = state.rootRotation === IDENTITY && state.rootTranslation === ORIGIN;
  for (let ordinal: number = 0; ordinal < count; ++ordinal) {
    const index: number = demanded === undefined ? ordinal : demanded[ordinal]!;
    const frame: IAutoMovieResolvedBone = rootRelative
      ? relative(nodes, state, index).frame
      : placed(nodes, state, index, state.rootRotation, state.rootTranslation).frame;
    append(result, resolvePreparedPoseFrame.copy(frame));
  }
  return result;
}

/** Only the private FK owner supplies already copied frames to these static writers. */
function appendArray(result: IAutoMovieResolvedBone[], frame: IAutoMovieResolvedBone): void {
  result.push(frame);
}

/** Index actual copied frames directly, retaining original last-name precedence/order. */
function appendMap(result: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>, frame: IAutoMovieResolvedBone): void {
  result.set(frame.bone, frame);
}

/** Articulation changes invalidate only this local rotation; parents are independent. */
function articulated(nodes: readonly INode[], state: IState, index: number): IFrameReading {
  const known: IFrameReading | undefined = state.frames[index];
  if (known?.epoch === state.epoch) return known;
  const node: INode = nodes[index]!;
  const articulation: IAutoMovieQuaternion = state.changes.read(index);
  const same: boolean = known !== undefined && PoseResolutionSnapshot.sameQuaternion(known.articulation, articulation);
  if (same) {
    known!.epoch = state.epoch;
    return known!;
  }
  const localRotation: IAutoMovieQuaternion = PoseResolutionSnapshot.sameQuaternion(articulation, IDENTITY)
    ? (node.identityLocalRotation ??= Quaternion.multiply(node.rotation, IDENTITY))
    : Quaternion.multiply(node.rotation, articulation);
  const reading: IFrameReading = known ?? {
    epoch: state.epoch, articulation, localRotation, localRevision: 0,
  };
  reading.epoch = state.epoch;
  reading.articulation = articulation;
  reading.localRotation = localRotation;
  ++reading.localRevision;
  if (known === undefined) state.frames[index] = reading;
  return reading;
}

/** Root-null demand retains independent relative frames without computing world placement. */
function relative(nodes: readonly INode[], state: IState, index: number): IWorldReading {
  const known: IWorldReading | undefined = state.frames[index]?.relative;
  const articulationRevision: number = state.changes.revision(index);
  if (known?.articulationRevision === articulationRevision) return known;
  const reading: IFrameReading = articulated(nodes, state, index);
  const node: INode = nodes[index]!;
  const parent: IWorldReading | undefined = node.parent < 0
    ? undefined : relative(nodes, state, node.parent);
  const parentRevision: number = parent?.revision ?? 0;
  if (known !== undefined && known.parentRevision === parentRevision &&
    known.localRevision === reading.localRevision) {
    known.articulationRevision = articulationRevision;
    return known;
  }
  const parentRotation: IAutoMovieQuaternion = parent?.frame.worldRotation ?? IDENTITY;
  const parentPosition: IAutoMovieVector3 = parent?.frame.worldPosition ?? ORIGIN;
  const staticParent: resolvePreparedPoseFrame.IReading | undefined = nodes[node.parent]?.restFrame;
  const atRest: boolean = reading.localRotation === node.identityLocalRotation &&
    (node.parent < 0 || (staticParent !== undefined &&
      staticParent.frame.worldRotation === parentRotation &&
      staticParent.frame.worldPosition === parentPosition));
  const frame: resolvePreparedPoseFrame.IReading = atRest
    ? resolvePreparedPoseFrame.readRest(restFrameOf(nodes, index), known)
    : resolvePreparedPoseFrame(node.name, node.translation, reading.localRotation,
      parentRotation, parentPosition, known);
  const output: IWorldReading = known ?? Object.assign(frame, {
    localRevision: reading.localRevision, parentRevision,
    revision: 1, articulationRevision,
  });
  if (known !== undefined) {
    known.localRevision = reading.localRevision;
    known.parentRevision = parentRevision;
    ++known.revision;
    known.articulationRevision = articulationRevision;
  }
  if (known === undefined) state.changes.observe(index);
  reading.relative = output;
  return output;
}

/** Keep ordinary parent-first placement grouping while sharing root-relative articulation. */
function placed(
  nodes: readonly INode[], state: IState, index: number,
  rotation: IAutoMovieQuaternion, translation: IAutoMovieVector3,
): NonNullable<IFrameReading["placed"]> {
  const known: IFrameReading["placed"] = state.frames[index]?.placed;
  const articulationRevision: number = state.changes.revision(index);
  if (known?.articulationRevision === articulationRevision &&
    known.rootRevision === state.rootRevision) return known;
  const reading: IFrameReading = articulated(nodes, state, index);
  const node: INode = nodes[index]!;
  const parent: IFrameReading["placed"] = node.parent < 0
    ? undefined : placed(nodes, state, node.parent, rotation, translation);
  const parentRevision: number = parent?.revision ?? 0;
  if (known !== undefined && known.rootRevision === state.rootRevision &&
    known.parentRevision === parentRevision && known.localRevision === reading.localRevision) {
    known.articulationRevision = articulationRevision;
    return known;
  }
  const frame: resolvePreparedPoseFrame.IReading = resolvePreparedPoseFrame(
    node.name, node.translation, reading.localRotation,
    parent?.frame.worldRotation ?? rotation, parent?.frame.worldPosition ?? translation, known,
  );
  const output: NonNullable<IFrameReading["placed"]> = known ?? Object.assign(frame, {
    rootRevision: state.rootRevision, parentRevision,
    localRevision: reading.localRevision, revision: 1,
    articulationRevision,
  });
  if (known !== undefined) {
    known.rootRevision = state.rootRevision;
    known.parentRevision = parentRevision;
    known.localRevision = reading.localRevision;
    ++known.revision;
    known.articulationRevision = articulationRevision;
  }
  if (known === undefined) state.changes.observe(index);
  reading.placed = output;
  return output;
}

/** Actual neutral FK is shared by ordinary rest reads and genuine mass-model production. */
function restFrameOf(nodes: readonly INode[], index: number): resolvePreparedPoseFrame.IReading {
  const node: INode = nodes[index]!;
  if (node.restFrame !== undefined) return node.restFrame;
  const parent: resolvePreparedPoseFrame.IReading | undefined = node.parent < 0
    ? undefined : restFrameOf(nodes, node.parent);
  const local: IAutoMovieQuaternion = node.identityLocalRotation ??=
    Quaternion.multiply(node.rotation, IDENTITY);
  const frame: resolvePreparedPoseFrame.IReading = resolvePreparedPoseFrame(
    node.name, node.translation, local,
    parent?.frame.worldRotation ?? IDENTITY, parent?.frame.worldPosition ?? ORIGIN,
  );
  node.restFrame = frame;
  return frame;
}
