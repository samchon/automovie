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
 * @evidence contracts/development/common.md#meaningful-documentation States immutable rig inputs, operation ownership, ordered current-pose admission and fresh output.
 * @evidence contracts/development/implementation.md#principled-implementation Exact clinical scalars, local quaternion revisions and parent/root dependencies determine parent-first FK; raw formulas and missing-articulation identity are retained.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Static rig construction stays in prepareSkeletonPoseResolution; this owner alone manages admission rows, demand ancestry and relative/placed revisions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every current authored record remains admitted in order. No timestamp, target, tolerance or external object identity substitutes for actual scalar dependencies.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(J) admission plus K-request sorting and D-ancestor checks; only changed local/parent/root operands compose and K public outputs are copied. Direct node rows avoid per-ancestor name-map lookup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Inputs are immutable static producer records. One operation retains exact successful joint/frame rows; changing or removing articulation and changing root scalars invalidates affected dependencies.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One returned reader owns O(U+B) current rows until its caller releases it. It retains no pose, target history, task or handle.
 */
export function preparePoseResolutionState(
  nodes: readonly INode[],
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  conventions: ReadonlyMap<string, IConvention>,
  fallback: IConvention,
): preparePoseResolutionState.IReader {
  const state: IState = createState();
  return {
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
 * @evidence contracts/development/design.md#principled-representation Immutable rest/clinical data determine FK; a reader owns current exact dynamic dependencies, while a fixed source owns an admitted baseline and complete per-query overlays.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The static public rig is the sole consumer of these internal constructors and types.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No target answer, pose identity cache or caller-set admission certificate is represented.
 */
export namespace preparePoseResolutionState {
/**
 * Immutable rest data and the parent-first index of one reachable bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines name, parent index, parent-frame metre offset and exact rest quaternion.
 * @evidence contracts/development/design.md#principled-representation One node has one parent index and immutable rest transform; -1 represents a null-parent root.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The static rig producer and sparse FK state share this one representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose, rig-specific name or alternate hierarchy is embedded; the producer owns rooted ordering.
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
 * @evidence contracts/development/common.md#meaningful-documentation States raw-axis ownership, optional clinical frames and lazy normalized basis.
 * @evidence contracts/development/design.md#principled-representation Fixed raw axes and optional degree-valued affine frames determine a joint's clinical interpretation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Static preparation owns the inputs and dynamic admission shares the successful normalized basis.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unused malformed inputs remain unadmitted; no flag certifies an external record or source pose.
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
   * @evidence contracts/development/common.md#meaningful-documentation States ordered pose admission, optional reachable demand and fresh outputs.
   * @evidence contracts/development/design.md#principled-representation The pose supplies clinical degrees/root placement; optional demand selects model-metre frames.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One resolve method serves the static producer's operation-owned readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No mutable state, revision, admission flag or cached target answer escapes.
   */
  export interface IReader {
    /** Admit the complete pose; an internal demand is created only by this immutable rig's prepareDemand owner, never exposed by the public rig API. */
    resolve(pose: IAutoMoviePose, requested?: ReadonlySet<AutoMovieHumanoidBone>, demand?: readonly number[]): IAutoMovieResolvedBone[];
  }

  /**
   * A genuine admitted fixed source with complete appended edits for each query.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines source-plus-edits precedence, fixed root, ordered edit admission and restoration when edits disappear.
   * @evidence contracts/development/design.md#principled-representation Each query is exactly the fixed source joint array followed by this query's edit records; later records win and the captured source root is unchanged.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Digit descent needs only fresh requested FK for its current candidate edits; no source pose, internal rows or results are exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer actually admits every source record before issuing this reader. Every supplied edit is admitted per query, arbitrary bone edits remain supported and no external resolved flag is trusted.
   */
  export interface IOverlayReader {
    /** Resolve baseline plus this query's complete ordered edits; absent edits restore baseline. */
    resolve(edits: readonly IAutoMovieJointPose[], requested?: ReadonlySet<AutoMovieHumanoidBone>): IAutoMovieResolvedBone[];
  }

  /**
   * Admit one fixed source and own exact FK updates for appended query edits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines eager source admission/snapshotting, fixed root, complete appended-edit semantics, fresh outputs and query-owned lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Sparse-pose concatenation selects the last source/edit articulation per bone. Source quaternions are produced by ordinary ordered admission once; a query's absent edit selects its baseline quaternion without rescanning source records.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses the same admission, node rows, root snapshot and FK recurrence as the complete-pose reader; only baseline selection differs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No supplied source record is presumed admitted, and every edit is checked in order including overwritten and stray entries. Source changes require a new producer; no tolerance, target result or restricted editable whitelist replaces real input.
   * @evidence contracts/development/implementation.md#efficient-algorithms Source admission is O(J) once. Each query admits E edits, sorts K requested indices and checks their D ancestors, copying K outputs; untouched baseline joints need neither scanning nor repeated conversion.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The producer snapshots successful source articulation and exact root scalars. Query state owns current overlay values/revisions, so removed edits restore baseline and changed ancestors update descendants under the original arithmetic.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One query workspace owns O(B+U) baseline/overlay/frame rows and fixed root scalars until release. It retains no source pose, edit array, query-result history, task or handle.
   */
  export function preparePose(
    nodes: readonly INode[],
    indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
    conventions: ReadonlyMap<string, IConvention>,
    fallback: IConvention,
    source: IAutoMoviePose,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): IOverlayReader {
    const baseline: IState = createState();
    for (const joint of source.joints) admit(baseline, joint, conventions, fallback, indices);
    const state: IState = createState();
    state.baseline = baseline.jointsByNode.map(
      (joint: IJointReading | undefined): IAutoMovieQuaternion | undefined => joint?.rotation,
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
   * @evidence contracts/development/common.md#meaningful-documentation States fixed name membership, immutable rig ownership and exact operation-reader provenance.
   * @evidence contracts/development/implementation.md#principled-implementation The demand owner snapshots actual reachable names into parent-first indices; each produced reader still admits its current complete pose and uses the original sparse FK recurrence.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses ordinary admission/root/frame owners; only output-index preparation moves outside repeated queries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No numeric index list or admitted-pose flag enters from a public caller. This owner derives the internal list from actual rig names and passes it only to that rig's genuine operation reader, which still checks every current joint.
   * @evidence contracts/development/implementation.md#efficient-algorithms K-name sorting is paid once. Queries admit J current records and check D ancestors/copy K outputs, reusing the same operation's completed exact rows from ordinary or other-demand reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable rig map and copied name membership establish demand equivalence. The caller lends its same-rig operation reader, so changing demanded outputs does not duplicate dynamic FK state or bypass current pose admission.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure owns K private indices and retains no reader, pose or source set. Dynamic rows remain with the borrowed operation reader until release, without tasks or handles.
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
  const flexion: number | null = clinical(joint, "flexion", convention.frame?.flexion);
  const abduction: number | null = clinical(joint, "abduction", convention.frame?.abduction);
  const twist: number | null = clinical(joint, "twist", convention.frame?.twist);
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
): number | null {
  const value: number | null = joint[axis];
  if (value !== null && !Number.isFinite(value))
    throw new Error(`jointToQuaternion ${axis} must be finite or null, but was ${value}`);
  toRigAngle(value, frame);
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



