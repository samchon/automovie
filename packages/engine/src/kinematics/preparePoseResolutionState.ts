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
import { preparePoseResolutionChanges } from "./preparePoseResolutionChanges";
import { preparePoseJointResolution } from "./preparePoseJointResolution";

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
 * @evidence contracts/development/common.md#meaningful-documentation Documents immutable rooted nodes/clinical conventions, complete-pose and individual-joint admission, fixed-source source-plus-edits readers, optional name demand, metre frames and fresh output ownership, including each companion's lifetime below.
 * @evidence contracts/development/implementation.md#principled-implementation Complete poses compose admitted clinical quaternions through parent-first FK. An individual joint uses the same real admission and returns a copied quaternion without claiming a completed pose. Final complete-pose selections revise actual affected DFS subtrees. preparePose actually admits/snapshots source records/root once before complete ordered overlays; prepareDemand resolves actual rooted names. All paths keep raw grouping and missing identity.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Static rig construction remains prepareSkeletonPoseResolution's responsibility. preparePoseJointResolution owns ordered clinical admission and static scalar/query-factor separation; preparePoseResolutionChanges owns final selection and affected-subtree revisions. This owner shares root snapshots, demand and relative/placed rows across its ordinary reader and two companions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Ordinary reads admit every current record, fixed-source production admits every baseline record and every query admits all supplied edits, including overwritten/stray records. No target, time, tolerance, editable whitelist or external admission flag certifies a result; numeric demands come only from the same immutable rig's name lookup.
 * @evidence contracts/development/implementation.md#efficient-algorithms Complete poses admit J records and compare current/previous membership; C final changes sort in O(C log C) and revise A affected descendants once. Demand sorts K names unless bound, then only invalidated ancestry needs checking before K fresh copies. Fixed sources admit baseline once then E edits. Actual identity-local and neutral root-relative computations prepare lazily once per static node. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Static nodes lazily keep actual rest-times-identity and neutral root-relative computations. Neutral reuse requires that exact local quaternion and actual static parent's private rotation/position references; static rows retain no operation frame. Operation rows share exact dynamic dependencies. Fixed-source production admits baseline/current membership before independent overlay snapshots; all changed/removed joints, edits and roots remain visible.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources An ordinary reader owns O(U+B) current rows until release. A fixed-source workspace owns O(B+U) baseline/overlay/frame data and fixed root scalars until its source operation ends. A bound-demand closure owns only K indices and retains no borrowed reader, pose or source set. No query-result history, task or handle survives those owners.
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
    resolve: (pose: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>, demand?: readonly number[]): IAutoMovieResolvedBone[] => {
      ++state.epoch;
      state.joints.begin();
      for (const joint of pose.joints) state.joints.admit(joint);
      state.changes.complete();
      setRoot(state, pose);
      return readFrames(nodes, indices, state, requested, demand);
    },
  };
}

/**
 * Internal immutable rig inputs and actual dynamic-reader producer contracts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines static input ownership and ordinary versus fixed-source reader semantics.
 * @evidence contracts/development/design.md#principled-representation INode owns one rooted parent index, actual exclusive DFS subtree end, metre rest offset/quaternion and lazy actual identity-local/neutral-root-relative results. IConvention owns fixed raw axes/optional degree frames plus successful fixed basis/scalar preparation. Complete-pose and fixed-source readers retain actual numerical admission; types do not certify external records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The static public rig consumes these constructors/types. Body/flight/digit paths need complete poses, actual fixed sources and fixed demand; chain-frame recovery also reads one actually admitted joint through the same convention. Existing interface/ROM owners supply numeric types, and no target result or mutable row escapes.
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
     * demand indices come only from this rig's actual prepareDemand producer.
     * Current admission, actual changed-subtree revisions and invalidated
     * ancestry precede K copies and optional live-name sorting. Exact current
     * rows remain with this operation and no input/result is retained.
     */
    resolve(pose: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>, demand?: readonly number[]): IAutoMovieResolvedBone[];
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
    setRoot(state, source);
    const demanded: readonly number[] | undefined = requested === undefined
      ? undefined : preparePoseBoneDemand(indices, nodes.length, requested);
    return {
      resolve: (edits: readonly IAutoMovieJointPose[], requested?: ReadonlySet<AutoMovieHumanoidBone>): IAutoMovieResolvedBone[] => {
        ++state.epoch;
        state.joints.begin();
        for (const joint of edits) state.joints.admit(joint);
        state.changes.complete();
        return readFrames(nodes, indices, state, requested,
          requested === undefined ? demanded : undefined);
      },
    };
  }

  /**
   * Snapshot demanded names once and read the same operation's actual FK state.
   *
   * Actual reachable names are sorted into rooted indices once in O(K log K).
   * The returned closure passes only those private indices to a genuine
   * same-rig reader; every current joint still receives ordinary admission.
   * Exact dynamic rows remain shared with that operation's other reads. The
   * closure retains K indices, without a reader, source set, pose or result.
   */
  export function prepareDemand(
    indices: ReadonlyMap<AutoMovieHumanoidBone, number>, count: number,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): (reader: IReader, pose: IAutoMoviePose) => IAutoMovieResolvedBone[] {
    const demanded: readonly number[] = preparePoseBoneDemand(indices, count, requested);
    return (reader: IReader, pose: IAutoMoviePose): IAutoMovieResolvedBone[] =>
      reader.resolve(pose, undefined, demanded);
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

/** Snapshot all changed root operands before committing either private dependency. */
function setRoot(state: IState, pose: IAutoMoviePose): void {
  const rotation: IAutoMovieQuaternion = pose.root?.rotation ?? IDENTITY;
  const translation: IAutoMovieVector3 = pose.root?.translation ?? ORIGIN;
  const sameRotationInput: boolean = PoseResolutionSnapshot.sameQuaternion(state.rootRotation, rotation);
  const sameTranslationInput: boolean = PoseResolutionSnapshot.sameVector(state.rootTranslation, translation);
  if (sameRotationInput && sameTranslationInput) return;
  const nextRotation: IAutoMovieQuaternion = sameRotationInput ? state.rootRotation
    : PoseResolutionSnapshot.sameQuaternion(IDENTITY, rotation) ? IDENTITY : PoseResolutionSnapshot.quaternion(rotation);
  const nextTranslation: IAutoMovieVector3 = sameTranslationInput ? state.rootTranslation
    : PoseResolutionSnapshot.sameVector(ORIGIN, translation) ? ORIGIN : PoseResolutionSnapshot.vector(translation);
  state.rootRotation = nextRotation;
  state.rootTranslation = nextTranslation;
  ++state.rootRevision;
}

/** Select parent-first output indices and visit only their actual ancestor closure. */
function readFrames(
  nodes: readonly INode[], indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  state: IState, requested?: ReadonlySet<AutoMovieHumanoidBone>,
  fixedDemand?: readonly number[],
): IAutoMovieResolvedBone[] {
  const demanded: readonly number[] = fixedDemand ??
    preparePoseBoneDemand(indices, nodes.length, requested);
  const result: IAutoMovieResolvedBone[] = [];
  for (const index of demanded) {
    const frame: IAutoMovieResolvedBone = state.rootRotation === IDENTITY && state.rootTranslation === ORIGIN
      ? relative(nodes, state, index).frame
      : placed(nodes, state, index, state.rootRotation, state.rootTranslation).frame;
    result.push(copy(frame));
  }
  return result;
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
  if (atRest && node.restFrame === undefined)
    node.restFrame = resolvePreparedPoseFrame(
      node.name, node.translation, reading.localRotation, parentRotation, parentPosition,
    );
  const frame: resolvePreparedPoseFrame.IReading = atRest
    ? resolvePreparedPoseFrame.readRest(node.restFrame!, known)
    : resolvePreparedPoseFrame(node.name, node.translation, reading.localRotation,
      parentRotation, parentPosition, known);
  const output: IWorldReading = Object.assign(frame, {
    localRevision: reading.localRevision, parentRevision,
    revision: (known?.revision ?? 0) + 1, articulationRevision,
  });
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
  const output: NonNullable<IFrameReading["placed"]> = Object.assign(frame, {
    rootRevision: state.rootRevision, parentRevision,
    localRevision: reading.localRevision, revision: (known?.revision ?? 0) + 1,
    articulationRevision,
  });
  reading.placed = output;
  return output;
}

/** Isolate all public mutable records from operation-owned dependency rows. */
function copy(frame: IAutoMovieResolvedBone): IAutoMovieResolvedBone {
  return { bone: frame.bone, localRotation: { ...frame.localRotation },
    worldRotation: { ...frame.worldRotation }, worldPosition: { ...frame.worldPosition } };
}
