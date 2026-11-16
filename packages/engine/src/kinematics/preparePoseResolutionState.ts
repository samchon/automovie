import type {
  AutoMovieHumanoidBone, IAutoMovieJointAxes, IAutoMovieJointPose,
  IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import { toRigAngle } from "../rom/toRigAngle";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";
import { PoseResolutionSnapshot } from "./PoseResolutionSnapshot";
import { resolvePreparedPoseFrame } from "./resolvePreparedPoseFrame";
import { preparePoseBoneDemand } from "./preparePoseBoneDemand";

/** The immutable rooted node representation owned by this state producer. */
type INode = preparePoseResolutionState.INode;

/** The static clinical convention shared by this rig's operation states. */
type IConvention = preparePoseResolutionState.IConvention;

/** The most recent successful conversion of one authored name. */
interface IJointReading {
  /** Static convention already selected for this exact authored name. */
  convention: IConvention;

  /** Clinical degrees, with null retaining its rest meaning. */
  flexion: number | null;

  /** Clinical abduction in degrees. */
  abduction: number | null;

  /** Clinical twist in degrees. */
  twist: number | null;

  /** Private articulation, never exposed in a returned transform. */
  rotation: IAutoMovieQuaternion;

  /** Query-owned changing-angle factors on this rig's immutable convention. */
  compose: ReturnType<typeof jointToQuaternionOnBasis.prepare>;

  /** Invocation in which the last authored record selected this row. */
  epoch: number;
}

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

  /** Last invocation that checked this placement. */
  epoch: number;
}

/** Dynamic FK rows belong to one live operation reader, never to pose identity. */
interface IState {
  /** Fixed-source articulation, used only when this query supplies no overlay. */
  baseline?: readonly (IAutoMovieQuaternion | undefined)[];

  /** Invocation counter used for sparse joint removal and per-call traversal. */
  epoch: number;

  /** Last successful authored conversion per bone name. */
  joints: Map<AutoMovieHumanoidBone, IJointReading>;

  /** Direct bone-index references to those same rows, avoiding hierarchy name lookups. */
  jointsByNode: (IJointReading | undefined)[];

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
 * @evidence contracts/development/common.md#meaningful-documentation Documents immutable rooted nodes/clinical conventions, complete-pose readers, fixed-source source-plus-edits readers, optional name demand, ordered admission, metre frames and fresh output ownership, including each companion's lifetime below.
 * @evidence contracts/development/implementation.md#principled-implementation Complete-pose resolution composes exact admitted clinical quaternions through parent-first FK. preparePose actually admits source records once, snapshots their last articulation/root and selects each query's complete ordered overlay before the baseline. prepareDemand resolves actual names to rooted indices. All paths use the same recurrence, raw grouping and missing identity.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Static rig construction remains prepareSkeletonPoseResolution's responsibility. This owner shares admission, root snapshots, demanded ancestry and relative/placed rows across its ordinary reader and two companions; fixed-source selection and fixed-demand preparation change only their stated input preparation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Ordinary reads admit every current record, fixed-source production admits every baseline record and every query admits all supplied edits, including overwritten/stray records. No target, time, tolerance, editable whitelist or external admission flag certifies a result; numeric demands come only from the same immutable rig's name lookup.
 * @evidence contracts/development/implementation.md#efficient-algorithms Complete poses cost O(J) admission plus K-name sorting, D-ancestor checks and K fresh copies. prepareDemand pays sorting once. preparePose pays source admission once and then E edit reads plus demanded ancestry, with optional bound demand. Only changed local/parent/root operands compose; direct node rows avoid ancestor name lookups and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Static inputs are owned immutable records. Operation readers share only exact successful scalar/frame dependencies; fixed demand borrows that same reader rather than duplicating state. A fixed-source producer may borrow actual same-rig admission rows, re-admits source records and filters current membership before copying baseline quaternions into independent overlay state. Changed/removed joints, edits and roots invalidate their actual dependencies.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources An ordinary reader owns O(U+B) current rows until release. A fixed-source workspace owns O(B+U) baseline/overlay/frame data and fixed root scalars until its source operation ends. A bound-demand closure owns only K indices and retains no borrowed reader, pose or source set. No query-result history, task or handle survives those owners.
 */
export function preparePoseResolutionState(
  nodes: readonly INode[],
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  conventions: ReadonlyMap<string, IConvention>,
  fallback: IConvention,
): preparePoseResolutionState.IReader {
  const state: IState = createState();
  return {
    preparePose: (source: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>): preparePoseResolutionState.IOverlayReader =>
      preparePoseResolutionState.preparePose(nodes, indices, conventions, fallback, source, requested, state),
    resolve: (pose: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>, demand?: readonly number[]): IAutoMovieResolvedBone[] => {
      ++state.epoch;
      for (const joint of pose.joints) admit(state, joint, conventions, fallback, indices);
      setRoot(state, pose);
      return readFrames(nodes, indices, state, requested, demand);
    },
  };
}

/**
 * Internal immutable rig inputs and actual dynamic-reader producer contracts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines static input ownership and ordinary versus fixed-source reader semantics.
 * @evidence contracts/development/design.md#principled-representation INode represents one rooted parent index, metre rest offset and quaternion; IConvention owns raw fixed axes/optional degree frames plus lazy successful basis admission. IReader accepts complete current poses and actual same-rig internal demand; IOverlayReader accepts complete ordered edits over one actually admitted fixed baseline/root. Raw finite/admission checks remain runtime responsibilities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The static public rig consumes these constructors/types; complete-pose resolution, actual fixed-source preparation and fixed-demand binding are the only operations current body, flight and digit consumers need. Existing interface/ROM owners supply all numeric types and no target result or mutable row escapes.
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

  /** Snapshot of the parent-frame rest translation in metres. */
  translation: IAutoMovieVector3;

  /** Snapshot of the parent-frame rest rotation; scale remains unused. */
  rotation: IAutoMovieQuaternion;
}

/**
 * Immutable clinical inputs and their lazy successful basis admission.
 *
 * Fixed raw axes and optional affine degree frames define clinical reading.
 * The first actual authored use admits the basis; an unused malformed mapping
 * stays unadmitted. No external record or source pose is certified here.
 */
export interface IConvention {
  /** Own-data raw axes, admitted lazily only when an authored joint uses them. */
  axes: IAutoMovieJointAxes;

  /** Unit basis produced once at its first authored use. */
  basis?: IAutoMovieJointAxes;

  /** Own-data affine clinical frames, absent when angles are rest-relative. */
  frame?: IAutoMovieRestFrame;
}


  /**
   * Fresh-output FK of complete changing poses on the same immutable rig.
   *
   * The pose supplies clinical degrees/root placement and optional demand
   * selects model-metre outputs. Only exact current dependency rows remain
   * private; no revision, source pose or target answer escapes.
   */
  export interface IReader {
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
     * O(J+D+K) work plus live-name sorting shares exact scalar dependencies;
     * current rows remain with this operation and no input/result is retained.
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
     * Optional live names override bound demand. O(E+D+K) work plus override
     * sorting reuses exact local/ancestor rows; fresh transforms escape while
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
   * Source work is O(J+B) once; queries use O(E+D+K) plus live-demand sorting.
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
    const baseline: IState = admission ?? createState();
    ++baseline.epoch;
    for (const joint of source.joints) admit(baseline, joint, conventions, fallback, indices);
    const state: IState = createState();
    state.baseline = baseline.jointsByNode.map(
      (joint: IJointReading | undefined): IAutoMovieQuaternion | undefined =>
        joint?.epoch === baseline.epoch ? joint.rotation : undefined,
    );
    setRoot(state, source);
    const demanded: readonly number[] | undefined = requested === undefined
      ? undefined : preparePoseBoneDemand(indices, nodes.length, requested);
    return {
      resolve: (edits: readonly IAutoMovieJointPose[], requested?: ReadonlySet<AutoMovieHumanoidBone>): IAutoMovieResolvedBone[] => {
        ++state.epoch;
        for (const joint of edits) admit(state, joint, conventions, fallback, indices);
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
function createState(): IState {
  return { epoch: 0, joints: new Map(), jointsByNode: [], frames: [],
    rootRotation: IDENTITY, rootTranslation: ORIGIN, rootRevision: 0 };
}

/** Snapshot all changed root operands before committing either private dependency. */
function setRoot(state: IState, pose: IAutoMoviePose): void {
  const rotation: IAutoMovieQuaternion = pose.root?.rotation ?? IDENTITY;
  const translation: IAutoMovieVector3 = pose.root?.translation ?? ORIGIN;
  const sameRotationInput: boolean = sameRotation(state.rootRotation, rotation);
  const sameTranslationInput: boolean = samePosition(state.rootTranslation, translation);
  if (sameRotationInput && sameTranslationInput) return;
  const nextRotation: IAutoMovieQuaternion = sameRotationInput ? state.rootRotation
    : sameRotation(IDENTITY, rotation) ? IDENTITY : PoseResolutionSnapshot.quaternion(rotation);
  const nextTranslation: IAutoMovieVector3 = sameTranslationInput ? state.rootTranslation
    : samePosition(ORIGIN, translation) ? ORIGIN : PoseResolutionSnapshot.vector(translation);
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

/** Admit every authored angle before a completed exact conversion can be reused. */
function admit(
  state: IState, joint: IAutoMovieJointPose,
  conventions: ReadonlyMap<string, IConvention>, fallback: IConvention,
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
): void {
  const known: IJointReading | undefined = state.joints.get(joint.bone);
  const convention: IConvention = known?.convention ?? conventions.get(joint.bone) ?? fallback;
  const basis: IAutoMovieJointAxes = convention.basis ??=
    normalizeJointAxes(convention.axes, "jointToQuaternion axes");
  const flexion: number | null = clinical(joint, "flexion", convention.frame?.flexion, known?.flexion);
  const abduction: number | null = clinical(joint, "abduction", convention.frame?.abduction, known?.abduction);
  const twist: number | null = clinical(joint, "twist", convention.frame?.twist, known?.twist);
  if (known !== undefined && Object.is(known.flexion, flexion) &&
    Object.is(known.abduction, abduction) && Object.is(known.twist, twist)) {
    known.epoch = state.epoch;
    return;
  }
  const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> =
    known?.compose ?? jointToQuaternionOnBasis.prepare(basis, convention.frame);
  const rotation: IAutoMovieQuaternion = compose({ flexion, abduction, twist });
  if (known === undefined) {
    const reading: IJointReading =
      { convention, flexion, abduction, twist, rotation, compose, epoch: state.epoch };
    state.joints.set(joint.bone, reading);
    const index: number | undefined = indices.get(joint.bone);
    if (index !== undefined) state.jointsByNode[index] = reading;
  } else {
    known.flexion = flexion;
    known.abduction = abduction;
    known.twist = twist;
    known.rotation = rotation;
    known.epoch = state.epoch;
  }
}

/** Articulation changes invalidate only this local rotation; parents are independent. */
function articulated(nodes: readonly INode[], state: IState, index: number): IFrameReading {
  const known: IFrameReading | undefined = state.frames[index];
  if (known?.epoch === state.epoch) return known;
  const node: INode = nodes[index]!;
  const joint: IJointReading | undefined = state.jointsByNode[index];
  const articulation: IAutoMovieQuaternion = joint?.epoch === state.epoch
    ? joint.rotation : state.baseline?.[index] ?? IDENTITY;
  const same: boolean = known !== undefined && sameRotation(known.articulation, articulation);
  if (same) {
    known!.epoch = state.epoch;
    return known!;
  }
  const localRotation: IAutoMovieQuaternion = Quaternion.multiply(node.rotation, articulation);
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
  const reading: IFrameReading = articulated(nodes, state, index);
  const known: IWorldReading | undefined = reading.relative;
  if (known?.epoch === state.epoch) return known;
  const node: INode = nodes[index]!;
  const parent: IWorldReading | undefined = node.parent < 0
    ? undefined : relative(nodes, state, node.parent);
  const parentRevision: number = parent?.revision ?? 0;
  if (known !== undefined && known.parentRevision === parentRevision &&
    known.localRevision === reading.localRevision) {
    known.epoch = state.epoch;
    return known;
  }
  const frame: resolvePreparedPoseFrame.IReading = resolvePreparedPoseFrame(
    node.name, node.translation, reading.localRotation,
    parent?.frame.worldRotation ?? IDENTITY, parent?.frame.worldPosition ?? ORIGIN, known,
  );
  const output: IWorldReading = Object.assign(frame, {
    localRevision: reading.localRevision, parentRevision,
    revision: (known?.revision ?? 0) + 1, epoch: state.epoch,
  });
  reading.relative = output;
  return output;
}

/** Keep ordinary parent-first placement grouping while sharing root-relative articulation. */
function placed(
  nodes: readonly INode[], state: IState, index: number,
  rotation: IAutoMovieQuaternion, translation: IAutoMovieVector3,
): NonNullable<IFrameReading["placed"]> {
  const reading: IFrameReading = articulated(nodes, state, index);
  const known: IFrameReading["placed"] = reading.placed;
  if (known?.epoch === state.epoch) return known;
  const node: INode = nodes[index]!;
  const parent: IFrameReading["placed"] = node.parent < 0
    ? undefined : placed(nodes, state, node.parent, rotation, translation);
  const parentRevision: number = parent?.revision ?? 0;
  if (known !== undefined && known.rootRevision === state.rootRevision &&
    known.parentRevision === parentRevision && known.localRevision === reading.localRevision) {
    known.epoch = state.epoch;
    return known;
  }
  const frame: resolvePreparedPoseFrame.IReading = resolvePreparedPoseFrame(
    node.name, node.translation, reading.localRotation,
    parent?.frame.worldRotation ?? rotation, parent?.frame.worldPosition ?? translation, known,
  );
  const output: NonNullable<IFrameReading["placed"]> = Object.assign(frame, {
    rootRevision: state.rootRevision, parentRevision,
    localRevision: reading.localRevision, revision: (known?.revision ?? 0) + 1,
    epoch: state.epoch,
  });
  reading.placed = output;
  return output;
}

/** Compare exact private quaternion values, including signed zero. */
function sameRotation(left: IAutoMovieQuaternion, right: IAutoMovieQuaternion): boolean {
  return Object.is(left.x, right.x) && Object.is(left.y, right.y) &&
    Object.is(left.z, right.z) && Object.is(left.w, right.w);
}

/** Read each finite clinical coordinate in the original F/A/T admission order. */
function clinical(
  joint: IAutoMovieJointPose,
  axis: "flexion" | "abduction" | "twist",
  frame: IAutoMovieAxisFrame | undefined,
  previous: number | null | undefined,
): number | null {
  const value: number | null = joint[axis];
  if (value !== null && !Number.isFinite(value))
    throw new Error(`jointToQuaternion ${axis} must be finite or null, but was ${value}`);

  // A successful nonnull reading already admitted this actual immutable frame.
  if (previous === undefined || previous === null) toRigAngle(value, frame);
  return value;
}

/** Preserve signed zero while detecting actual root translation edits. */
function samePosition(left: IAutoMovieVector3, right: IAutoMovieVector3): boolean {
  return Object.is(left.x, right.x) && Object.is(left.y, right.y) &&
    Object.is(left.z, right.z);
}

/** Isolate all public mutable records from operation-owned dependency rows. */
function copy(frame: IAutoMovieResolvedBone): IAutoMovieResolvedBone {
  return { bone: frame.bone, localRotation: { ...frame.localRotation },
    worldRotation: { ...frame.worldRotation }, worldPosition: { ...frame.worldPosition } };
}



