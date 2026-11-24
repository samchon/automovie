import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSkeletonPoseResolution,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { composePoseFrames } from "./composePoseFrames";
import { preparePoseBoneDemand } from "./preparePoseBoneDemand";
import { preparePoseJointResolution } from "./preparePoseJointResolution";
import { preparePosePlacement } from "./preparePosePlacement";
import { preparePoseReading } from "./preparePoseReading";
import { preparePoseResolutionChanges } from "./preparePoseResolutionChanges";
import type { preparePoseTupleScan } from "./preparePoseTupleScan";

/** The immutable rooted node representation owned by this state producer. */
type INode = preparePoseResolutionState.INode;

/** The static clinical convention shared by this rig's operation states. */
type IConvention = preparePoseResolutionState.IConvention;

/** The dynamic rows of one live operation reader, never of a pose's identity. */
interface IState {
  /** The selection of the last completed admission, as numbers. */
  changes: preparePoseResolutionChanges.ITracker;

  /** Ordered joint admission and successful current scalar/composition rows. */
  joints: preparePoseJointResolution.IReader;

  /** The frames composed from the selection and the root. */
  frames: composePoseFrames.IFrames;

  /** The selection's version the frames were composed at; -1 before any. */
  composed: number;

  /** The root's revision the frames were composed at. */
  placed: number;

  /** Rows completed for this selection and root. */
  rows: Uint8Array;

  /** The last immutable bound demand whose parent-first closure was derived. */
  planned?: readonly number[];

  /** The rooted indices required by that bound demand. */
  ancestors?: readonly number[];

  /** The number of completed rows for this selection and root. */
  completed: number;

  /** Private immutable root quaternion, reused only while actual scalars match. */
  rootRotation: IAutoMovieQuaternion;

  /** Private immutable root translation, separate from root rotation changes. */
  rootTranslation: IAutoMovieVector3;

  /** Revision of that exact root tuple. */
  rootRevision: number;
}

/** Private identity operands; no returned transform aliases them. */
const IDENTITY: IAutoMovieQuaternion = Quaternion.identity();

/** Private root-relative origin. */
const ORIGIN: IAutoMovieVector3 = Vector3.create();

/**
 * Own the dynamic FK rows of one operation on one immutable prepared rig.
 *
 * A pose is admitted record by record, in order, by the joint admission; its
 * completed selection is a numeric row of articulations
 * (`preparePoseResolutionChanges`), and its frames are composed from that row
 * and the root in one parent-first pass on the rig's numeric tables
 * (`composePoseFrames`), again only when the selection or the root changed. A
 * public bone record is made from the composed rows for each bone a read
 * demands, and for no other.
 */
export function preparePoseResolutionState(
  nodes: readonly INode[],
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  conventions: ReadonlyMap<string, IConvention>,
  fallback: IConvention,
): preparePoseResolutionState.IReader {
  const tables: composePoseFrames.ITables = composePoseFrames.tables(nodes);
  const state: IState = createState(tables, indices, conventions, fallback);
  return {
    joint: (joint: IAutoMovieJointPose): IAutoMovieQuaternion => {
      state.joints.admit(joint);
      return state.joints.rotation();
    },
    preparePose: (
      source: IAutoMoviePose,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): preparePoseResolutionState.IOverlayReader =>
      preparePoseResolutionState.preparePose(
        nodes,
        indices,
        conventions,
        fallback,
        source,
        requested,
        state,
      ),
    resolve: (
      pose: IAutoMoviePose,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
      demand?: readonly number[],
    ): IAutoMovieResolvedBone[] =>
      readFrames(
        tables,
        indices,
        admitPose(state, pose),
        [],
        appendArray,
        requested,
        demand,
      ),
    resolveMap: (
      pose: IAutoMoviePose,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
      demand?: readonly number[],
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      readFrames(
        tables,
        indices,
        admitPose(state, pose),
        new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>(),
        appendMap,
        requested,
        demand,
      ),
    read: (pose: IAutoMoviePose): preparePoseReading.IReading => {
      admitPose(state, pose);
      return preparePoseReading(tables, indices, {
        articulations: state.changes.selected.slice(),
        rootRotation: state.rootRotation,
        rootTranslation: state.rootTranslation,
      });
    },
    resolveTuples: (
      scan: preparePoseTupleScan.IScan,
      pose: Omit<IAutoMoviePose, "joints">,
      demand?: readonly number[],
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      state.joints.begin();
      scan(state.joints);
      state.changes.complete();
      preparePosePlacement(state, pose, IDENTITY, ORIGIN);
      return readFrames(
        tables,
        indices,
        state,
        new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>(),
        appendMap,
        undefined,
        demand,
      );
    },
  };
}

/** Internal immutable rig inputs and actual dynamic-reader producer contracts. */
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
   * selects model-metre outputs. Only the current selection and its frames
   * remain private; no source pose or target answer escapes.
   */
  export interface IReader {
    /**
     * Actually admit one current joint on the same static convention, sharing
     * only successful exact conversion and returning a fresh quaternion. This
     * constant-size read completes no pose/membership selection or FK; later
     * complete poses still admit every record.
     */
    joint(joint: IAutoMovieJointPose): IAutoMovieQuaternion;

    /**
     * Actually admit and snapshot a fixed source/root once, with optional bound
     * names. The shared producer reuses only exact completed joint conversion
     * from this operation; it never presumes source admission. O(J+B) baseline
     * preparation creates an independent workspace, released with that source
     * operation, without retaining this reader or source pose.
     */
    preparePose(
      source: IAutoMoviePose,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IOverlayReader;

    /**
     * Admit every complete-pose record in order, then return the requested
     * rooted frames as fresh records. Internal demand indices come only from
     * this rig's actual name-demand producer. No input or result is retained.
     */
    resolve(
      pose: IAutoMoviePose,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
      demand?: readonly number[],
    ): IAutoMovieResolvedBone[];

    /**
     * The same complete ordered admission and composition as resolve, directly
     * into a fresh name map; callers own the map and all nested values.
     */
    resolveMap(
      pose: IAutoMoviePose,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
      demand?: readonly number[],
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * Admit a complete pose in order once and return its articulations and root
     * as a reading whose bones any number of readers take without another
     * admission; later edits of the pose do not reach it.
     */
    read(pose: IAutoMoviePose): preparePoseReading.IReading;

    /**
     * Admit every genuinely staged scalar after root construction, then compose
     * and copy as an ordinary read does.
     */
    resolveTuples(
      scan: preparePoseTupleScan.IScan,
      pose: Omit<IAutoMoviePose, "joints">,
      demand?: readonly number[],
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * A fixed source answering edits
   * (`IAutoMovieSkeletonPoseResolution.IOverlayReader`).
   */
  export type IOverlayReader = IAutoMovieSkeletonPoseResolution.IOverlayReader;

  /**
   * Admit one fixed source and own the frames of its appended query edits.
   *
   * Ordinary ordered admission produces the last source articulation per bone;
   * current membership is filtered before snapshotting, even with a borrowed
   * same-rig admission state. Each query admits its complete appended edits and
   * missing edits select baseline, through the unchanged parent-first FK.
   * Source work is O(J+B) once; a query admits E edits and composes once.
   * Release the independent workspace with the source operation; source edits
   * require a new producer and no pose or query-result history is kept.
   */
  export function preparePose(
    nodes: readonly INode[],
    indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
    conventions: ReadonlyMap<string, IConvention>,
    fallback: IConvention,
    source: IAutoMoviePose,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    admission?: object,
  ): IOverlayReader {
    const tables: composePoseFrames.ITables = composePoseFrames.tables(nodes);
    const baseline: IState =
      (admission as IState | undefined) ??
      createState(tables, indices, conventions, fallback);
    baseline.joints.begin();
    for (const joint of source.joints) baseline.joints.admit(joint);
    const rows: Float64Array = composePoseFrames.identities(tables.count);
    baseline.joints.snapshot(rows);
    const state: IState = createState(
      tables,
      indices,
      conventions,
      fallback,
      rows,
    );
    preparePosePlacement(state, source, IDENTITY, ORIGIN);
    const demanded: readonly number[] | undefined =
      requested === undefined
        ? undefined
        : preparePoseBoneDemand(indices, nodes.length, requested);
    return {
      resolve: (
        edits: readonly IAutoMovieJointPose[],
        requested?: ReadonlySet<AutoMovieHumanoidBone>,
      ): IAutoMovieResolvedBone[] => {
        admitEdits(state, edits);
        return readFrames(
          tables,
          indices,
          state,
          [],
          appendArray,
          requested,
          requested === undefined ? demanded : undefined,
        );
      },
      resolveMap: (
        edits: readonly IAutoMovieJointPose[],
        requested?: ReadonlySet<AutoMovieHumanoidBone>,
      ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
        admitEdits(state, edits);
        return readFrames(
          tables,
          indices,
          state,
          new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>(),
          appendMap,
          requested,
          requested === undefined ? demanded : undefined,
        );
      },
    };
  }

  /**
   * Read genuine geometric rest from this producer's immutable rooted nodes. No
   * articulation or clinical frame is admitted: this is exactly root-null FK
   * with no authored joints, composed once per rig and copied as B fresh
   * records a read; no operation, source pose or output array is retained.
   */
  export function rest(nodes: readonly INode[]): IAutoMovieResolvedBone[] {
    const tables: composePoseFrames.ITables = composePoseFrames.tables(nodes);
    let frames: composePoseFrames.IFrames | undefined = RESTS.get(tables);
    if (frames === undefined) {
      frames = composePoseFrames.frames(tables.count);
      composePoseFrames(
        tables,
        composePoseFrames.identities(tables.count),
        IDENTITY,
        ORIGIN,
        frames,
      );
      RESTS.set(tables, frames);
    }
    const result: IAutoMovieResolvedBone[] = [];
    for (let index: number = 0; index < tables.count; ++index)
      result.push(composePoseFrames.bone(tables.names, frames, index));
    return result;
  }
}

/** Each rig's rest frames by its tables. */
const RESTS: WeakMap<composePoseFrames.ITables, composePoseFrames.IFrames> =
  new WeakMap();

/** Allocate one operation's rows, without retaining any authored input. */
function createState(
  tables: composePoseFrames.ITables,
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  conventions: ReadonlyMap<string, IConvention>,
  fallback: IConvention,
  baseline?: Float64Array,
): IState {
  const changes: preparePoseResolutionChanges.ITracker =
    preparePoseResolutionChanges(tables.count, baseline);
  return {
    changes,
    joints: preparePoseJointResolution(indices, conventions, fallback, changes),
    frames: composePoseFrames.frames(tables.count),
    composed: -1,
    placed: -1,
    rows: new Uint8Array(tables.count),
    completed: 0,
    rootRotation: IDENTITY,
    rootTranslation: ORIGIN,
    rootRevision: 0,
  };
}

/**
 * Both output representations begin with the same original ordered
 * admission/root phases.
 */
function admitPose(state: IState, pose: IAutoMoviePose): IState {
  admitEdits(state, pose.joints);
  preparePosePlacement(state, pose, IDENTITY, ORIGIN);
  return state;
}

/**
 * Complete every current appended edit before either output representation
 * reads FK.
 */
function admitEdits(
  state: IState,
  edits: readonly IAutoMovieJointPose[],
): void {
  state.joints.begin();
  for (const joint of edits) state.joints.admit(joint);
  state.changes.complete();
}

/**
 * Compose the frames when the selection or the root changed, then make a fresh
 * record per demanded bone, parent first.
 */
function readFrames<
  T extends
    | IAutoMovieResolvedBone[]
    | Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
>(
  tables: composePoseFrames.ITables,
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  state: IState,
  result: T,
  append: (result: T, frame: IAutoMovieResolvedBone) => void,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
  fixedDemand?: readonly number[],
): T {
  const demanded: readonly number[] | undefined =
    fixedDemand ??
    (requested === undefined
      ? undefined
      : preparePoseBoneDemand(indices, tables.count, requested));
  const version: number = state.changes.version();
  if (state.composed !== version || state.placed !== state.rootRevision) {
    if (demanded !== undefined && demanded.length < tables.count)
      state.rows.fill(0);
    state.completed = 0;
    state.composed = version;
    state.placed = state.rootRevision;
  }
  if (state.completed < tables.count) composeDemand(state, tables, demanded);
  const count: number = demanded?.length ?? tables.count;
  for (let ordinal: number = 0; ordinal < count; ++ordinal)
    append(
      result,
      composePoseFrames.bone(
        tables.names,
        state.frames,
        demanded === undefined ? ordinal : demanded[ordinal]!,
      ),
    );
  return result;
}

/**
 * Compose newly required parent-first rows, sharing completed ancestors across
 * reads.
 */
function composeDemand(
  state: IState,
  tables: composePoseFrames.ITables,
  demanded: readonly number[] | undefined,
): void {
  const count: number = tables.count;
  let ancestors: readonly number[] | undefined;
  if (demanded !== undefined && demanded.length < count) {
    if (state.planned !== demanded) {
      const needed: Set<number> = new Set();
      for (const output of demanded)
        for (
          let index: number = output;
          index >= 0 && !needed.has(index);
          index = tables.parents[index]!
        )
          needed.add(index);
      state.ancestors = [...needed].sort(
        (left: number, right: number): number => left - right,
      );
      state.planned = demanded;
    }
    ancestors = state.ancestors;
  }
  if (state.completed === 0) {
    const length: number = ancestors?.length ?? count;
    composePoseFrames(
      tables,
      state.changes.selected,
      state.rootRotation,
      state.rootTranslation,
      state.frames,
      0,
      length,
      ancestors,
    );
    if (ancestors !== undefined)
      for (const index of ancestors) state.rows[index] = 1;
    state.completed = length;
    return;
  }

  // A second demand at this pose adds only the parents and outputs still
  // missing. The closure's order makes every parent available to the kernel.
  const missing: number[] = [];
  const length: number = ancestors?.length ?? count;
  for (let ordinal: number = 0; ordinal < length; ++ordinal) {
    const index: number =
      ancestors === undefined ? ordinal : ancestors[ordinal]!;
    if (state.rows[index] === 0) missing.push(index);
  }
  if (missing.length !== 0) {
    composePoseFrames(
      tables,
      state.changes.selected,
      state.rootRotation,
      state.rootTranslation,
      state.frames,
      0,
      missing.length,
      missing,
    );
    for (const index of missing) state.rows[index] = 1;
    state.completed += missing.length;
  }
}
/** Append one fresh record to an array result. */
function appendArray(
  result: IAutoMovieResolvedBone[],
  frame: IAutoMovieResolvedBone,
): void {
  result.push(frame);
}

/**
 * Index one fresh record by its name, retaining original last-name
 * precedence/order.
 */
function appendMap(
  result: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  frame: IAutoMovieResolvedBone,
): void {
  result.set(frame.bone, frame);
}
