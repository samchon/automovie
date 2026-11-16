import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import { toRigAngle } from "../rom/toRigAngle";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import type { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { SKELETON_ROOT_PARENT } from "./constants/SKELETON_ROOT_PARENT";
import { indexSkeletonTopology } from "./indexSkeletonTopology";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";
import type { preparePoseResolution } from "./preparePoseResolution";
import { resolvePreparedPoseFrame } from "./resolvePreparedPoseFrame";
import { PoseResolutionSnapshot } from "./PoseResolutionSnapshot";
import { skeletonJointAxes } from "./skeletonJointAxes";

/** Immutable rest data and the parent-first index of one reachable bone. */
interface INode {
  /** Original name, preserved in outputs and joint lookup. */
  name: AutoMovieHumanoidBone;

  /** Parent index, or -1 for a null-parent root. */
  parent: number;

  /** Snapshot of the parent-frame rest translation in metres. */
  translation: IAutoMovieVector3;

  /** Snapshot of the parent-frame rest rotation; scale remains unused. */
  rotation: IAutoMovieQuaternion;
}

/** Immutable clinical inputs and their lazy successful basis admission. */
interface IConvention {
  /** Own-data raw axes, admitted lazily only when an authored joint uses them. */
  axes: IAutoMovieJointAxes;

  /** Unit basis produced once at its first authored use. */
  basis?: IAutoMovieJointAxes;

  /** Own-data affine clinical frames, absent when angles are rest-relative. */
  frame?: IAutoMovieRestFrame;
}

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

/** Private identity inputs; outputs always copy their scalar components. */
const IDENTITY: IAutoMovieQuaternion = Object.freeze(Quaternion.identity());

/** Private root-relative origin. */
const ORIGIN: IAutoMovieVector3 = Object.freeze(Vector3.create());

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
  const operations: WeakMap<ReturnType<typeof preparePoseResolution>, IState> =
    new WeakMap();
  const preparedAxes: Readonly<Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>> =
    Object.freeze(Object.fromEntries(Array.from(conventions,
      ([name, convention]: [string, IConvention]): [string, IAutoMovieJointAxes] =>
        [name, convention.axes],
    )));
  return {
    jointAxes: preparedAxes,
    resolve: (
      pose: IAutoMoviePose,
      operation?: ReturnType<typeof preparePoseResolution>,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieResolvedBone[] => {
      let state: IState | undefined = operation === undefined
        ? undefined : operations.get(operation);
      if (state === undefined) {
        state = { epoch: 0, joints: new Map(), jointsByNode: [], frames: [],
          rootRotation: IDENTITY, rootTranslation: ORIGIN, rootRevision: 0 };
        if (operation !== undefined) operations.set(operation, state);
      }
      ++state.epoch;
      for (const joint of pose.joints)
        admit(state, joint, conventions, fallback, indices);
      const demanded: number[] = [];
      if (requested === undefined)
        for (let index: number = 0; index < nodes.length; ++index) demanded.push(index);
      else {
        for (const name of requested) {
          const index: number | undefined = indices.get(name);
          if (index !== undefined) demanded.push(index);
        }
        demanded.sort((left: number, right: number): number => left - right);
      }
      const result: IAutoMovieResolvedBone[] = [];
      if (demanded.length === 0) return result;
      const rotation: IAutoMovieQuaternion = pose.root?.rotation ?? IDENTITY;
      const translation: IAutoMovieVector3 = pose.root?.translation ?? ORIGIN;
      const sameRotationInput: boolean = sameRotation(state.rootRotation, rotation);
      const sameTranslationInput: boolean = samePosition(state.rootTranslation, translation);
      if (!sameRotationInput || !sameTranslationInput) {
        const nextRotation: IAutoMovieQuaternion = sameRotationInput
          ? state.rootRotation : sameRotation(IDENTITY, rotation)
            ? IDENTITY : PoseResolutionSnapshot.quaternion(rotation);
        const nextTranslation: IAutoMovieVector3 = sameTranslationInput
          ? state.rootTranslation : samePosition(ORIGIN, translation)
            ? ORIGIN : PoseResolutionSnapshot.vector(translation);
        state.rootRotation = nextRotation;
        state.rootTranslation = nextTranslation;
        ++state.rootRevision;
      }
      for (const index of demanded) {
        const frame: IAutoMovieResolvedBone = state.rootRotation === IDENTITY &&
          state.rootTranslation === ORIGIN
          ? relative(nodes, state, index).frame
          : placed(nodes, state, index, state.rootRotation, state.rootTranslation).frame;
        result.push(copy(frame));
      }
      return result;
    },
  };
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
    /** Immutable merged raw-axis snapshot for the same rig's IK; normalization remains lazy at each original use site. */
    readonly jointAxes: Readonly<Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>>;

    /** Resolve all or only requested reachable bones, borrowing an operation reader's lifetime for exact computation reuse; every authored record is still admitted in order. */
    resolve(
      pose: IAutoMoviePose,
      operation?: ReturnType<typeof preparePoseResolution>,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieResolvedBone[];
  }
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
    ? joint.rotation : IDENTITY;
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

