import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { combinePhysicalMassProperties } from "../physics/combinePhysicalMassProperties";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { resolveAutoMovieCenterOfMass } from "./resolveAutoMovieCenterOfMass";
import { resolveAutoMovieMomentum } from "./resolveAutoMovieMomentum";

/** Private nominal identity prevents constructing a prepared model externally. */
const BRAND: unique symbol = Symbol("prepared mass model");

/** The live state of each explicit model owner, never keyed by mutable body identity. */
const STATES: WeakMap<prepareAutoMovieMassModel.IPrepared, IState> = new WeakMap();

/**
 * Snapshot one mass model for a synchronous physical planning operation.
 *
 * Call release in finally after the last inertia, momentum or centre query.
 * Preparation validates finite SI model values and copies every local numeric
 * prerequisite. A prepared model therefore keeps its meaning if its source is
 * edited, while every requested posed bone is still read at its actual value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States finite SI snapshot admission and release ownership. Its namespace's bones supplies a fresh mass-bearing FK demand, pose fresh ordered rigid parts and centre, place only the centre, inertia the current composite tensor, between positive-interval momentum, and release idempotent invalidation; their local comments state common-frame units and caller ownership.
 * @evidence contracts/development/implementation.md#principled-implementation The family retains the existing ordered segmental mean, bone-position-plus-rotated-local-point placement, bone-times-local-principal quaternion, physical tensor with every current parallel-axis term, and two-pose orbital-plus-spin momentum. Fixed bone-local properties are separate from each actual common-frame transform and interval.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One opaque token owns the admitted model and bounded scalar prerequisites. Namespace readers select the same model: bones exposes names, pose/place share readFrame and the existing mean, inertia delegates prepared physical tensor arithmetic, between delegates the original interval reduction, and release deletes the sole live state.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No posed answer, target, time grid or approximate key substitutes for a requested transform. Non-finite properties, negative mass or inertia, zero principal rotations and an inconsistent total mass are refused at preparation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation and each physical read are O(S) for S segments; bones returns O(U) names and release is one weak deletion. Private last-frame and intrinsic-key storage is reused on changes, while public pose results remain fresh. Place omits unused principal/part records; unchanged rotation, intrinsic frame and endpoint quaternions respectively omit local products, axis products and inverse/log/slerp preparation. All current sums/rates still run.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Copied model scalars fix one epoch. ReadFrame compares copied position/quaternion coordinates with Object.is; tensor preparation compares current moments/principal quaternions at each ordered index; interval preparation compares all eight copied endpoint coordinates and separately keys midpoint intrinsic tensors. Mutation and signed zero remain visible, and no bone identity, target, time grid or prior momentum answer establishes equivalence.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The token owns O(S) copied model, last frames, intrinsic and endpoint numeric prerequisites, with no query population or bone map. Each pose/centre/tensor/momentum result is fresh and retains no token/source; callers own returned sets and snapshots. Release deletes all private state on success or failure, is idempotent, and every later reader rejects the released token.
 */
export function prepareAutoMovieMassModel(
  source: resolveAutoMovieCenterOfMass.IModel,
): prepareAutoMovieMassModel.IPrepared {
  const segments: resolveAutoMovieCenterOfMass.ISegment[] = source.segments.map(
    (segment: resolveAutoMovieCenterOfMass.ISegment): resolveAutoMovieCenterOfMass.ISegment => {
      if (
        !Number.isFinite(segment.mass) || segment.mass < 0 ||
        !finiteVector(segment.point) || !finiteVector(segment.inertia) ||
        segment.inertia.x < 0 || segment.inertia.y < 0 || segment.inertia.z < 0 ||
        !finiteQuaternion(segment.axes) ||
        !(Math.hypot(segment.axes.x, segment.axes.y, segment.axes.z, segment.axes.w) > 0)
      )
        throw new Error(`The prepared mass model needs finite physical data for ${segment.bone}`);
      return {
        bone: segment.bone,
        mass: segment.mass,
        point: copyVector(segment.point),
        inertia: copyVector(segment.inertia),
        axes: copyQuaternion(segment.axes),
      };
    },
  );
  const mass: number = segments.reduce(
    (sum: number, segment: resolveAutoMovieCenterOfMass.ISegment): number => sum + segment.mass,
    0,
  );
  if (!(Number.isFinite(mass) && mass > 0 && Object.is(mass, source.mass)))
    throw new Error("The prepared mass model needs its finite positive segment mass sum");
  const token: prepareAutoMovieMassModel.IPrepared = { [BRAND]: true };
  STATES.set(token, {
    model: { mass, segments },
    frames: [],
    tensor: physicalInertiaTensor.prepare(),
    interval: resolveAutoMovieMomentum.prepareIntervals(),
  });
  return token;
}

/**
 * Readers of an explicitly owned mass-model snapshot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish a nominal operation handle from live posed bones, document mass-bearing demand, full parts versus centre-only demand, positive seconds and SI tensor/momentum frames, fresh output ownership and post-release rejection.
 * @evidence contracts/development/design.md#principled-representation The opaque token identifies one validated bone-local mass model in kilograms and metres, separately from actual posed common-frame bones.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Airborne history consumes pose, inertia and between; the performance pass consumes bones/place and releases the same token. The private-symbol IPrepared exposes no model or numeric cache, while outputs import the existing mass, momentum and resolved-bone types.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A private unique-symbol member prevents structural construction, and a weak live-state table validates every token at runtime. No body identity or public mutable model snapshot is exposed.
 */
export namespace prepareAutoMovieMassModel {
  /**
   * An operation-owned handle, invalid after release; it exposes no numeric cache.
   *
   * States operation ownership and invalidation after release.
   * A private nominal symbol identifies one admitted SI mass-model epoch without exposing mutable physical data.
   * The factory and numeric readers exchange only this handle; every model value stays private.
   * Callers cannot structurally construct the token, and live weak-state admission rejects a foreign or released token at runtime.
   */
  export interface IPrepared {
    /** Nominal model identity; only the factory supplies it. */
    readonly [BRAND]: true;
  }

  /**
   * The segment-bearing bones of this model, for demand-driven FK.
   * The fresh set is caller-owned and can be changed without changing the
   * preparation. Ancestors remain the FK owner's responsibility.
   *
   * States mass-bearing bone scope, fresh-set ownership and ancestor ownership.
   * The exact set of declared mass-segment bone names is sufficient for the existing segmental mass formulas.
   * One model-state lookup and a set construction retain the existing names without a new hierarchy owner.
   * No segment is filtered by size or mass, and FK still owns every needed ancestor.
   * O(S) traversal and O(U) fresh set storage for S segments on U distinct bones, paid once by the flight consumer.
   * Reads this token's immutable model snapshot; the returned set is independent of its private model and later caller edits.
   * The caller owns the fresh set; the function stores no additional population or handle.
   */
  export function bones(prepared: IPrepared): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set(state(prepared).model.segments.map(
      (segment: resolveAutoMovieCenterOfMass.ISegment): AutoMovieHumanoidBone => segment.bone,
    ));
  }

  /**
   * Read fresh rigid parts and their ordered mass-weighted centre in the
   * supplied bones' common frame. Exact unchanged frames reuse only their
   * private point and principal-frame transforms, never caller-owned records.
   *
   * States common-frame SI output, ordered parts, fresh records and exact scalar reuse.
   * A mass point follows its bone position and unit rotation, its principal frame is the bone rotation times fixed local axes, and the existing ordered mass mean gives the centre.
   * One model-order mean pass reads each private frame and assembles fresh public parts at the same visit.
   * Missing bones throw and every requested transform is compared by its actual numeric components; no time or pose identity replaces the frame.
   * O(S) scalar comparisons and fresh parts for S segments; only changed rotation requires local offset and principal quaternion products.
   * Copied model properties and exact copied frame coordinates identify equivalent transforms; caller changes to returned centres, inertia or quaternions cannot alter the private prerequisites.
   * The caller owns the fresh O(S) parts and centre. The token retains only one last numeric frame per segment until release, with no bone map or pose population.
   */
  export function pose(
    prepared: IPrepared,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): resolveAutoMovieMomentum.IPosed {
    const current: IState = state(prepared);
    const parts: combinePhysicalMassProperties.IPart[] = [];
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.mean(
      current.model,
      (segment: resolveAutoMovieCenterOfMass.ISegment, i: number): IAutoMovieVector3 => {
        const frame: IFrame = readFrame(current, segment, i, bones);
        const principal: IAutoMovieQuaternion = frame.principal ??=
          Quaternion.multiply(frame.rotation, segment.axes);
        parts.push({
          mass: segment.mass,
          centerOfMass: copyVector(frame.point),
          inertia: copyVector(segment.inertia),
          inertiaRotation: copyQuaternion(principal),
        });
        return frame.point;
      },
    );
    return { parts, centre };
  }

  /**
   * The centre in the actual bones' common frame, metres. A centre-only
   * demand does not compute principal frames or allocate rigid-part records.
   *
   * States frame, metres and centre-only demand behavior.
   * Uses the same segmental mass mean and local-to-common point transform as pose and ordinary centre placement.
   * One shared frame reader feeds the existing ordered mean without assembling unused inertia fields.
   * Every segment remains in the sum and missing bones throw rather than supplying a guessed centre.
   * O(S) comparisons and accumulation, with one fresh result and no per-segment output part allocation.
   * Shares exact numeric point prerequisites with pose under the same immutable model snapshot and copied frame keys.
   * Returns one fresh point and retains no additional query state; the token owns its O(S) last-frame data until release.
   */
  export function place(
    prepared: IPrepared,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 {
    const current: IState = state(prepared);
    return resolveAutoMovieCenterOfMass.mean(
      current.model,
      (segment: resolveAutoMovieCenterOfMass.ISegment, i: number): IAutoMovieVector3 =>
        readFrame(current, segment, i, bones).point,
    );
  }

  /**
   * The actual posed composite tensor about its own centre, kg m squared.
   * Only the intrinsic rotation prerequisites share exact numeric work;
   * every current mass shift and segment-order sum is performed again.
   *
   * States tensor units, centre and which current contributions remain evaluated.
   * Delegates R diag(I) R transpose and the parallel-axis sum to the physical tensor owner's prepared reader; translated centres never enter an intrinsic tensor's equivalence key.
   * A live token lookup supplies one operation-owned tensor reader to the existing posed parts and centre.
   * No inertia term, shift or physical check is omitted, and no symmetric-entry copy changes the original arithmetic.
   * O(S) comparisons and ordered sums for S parts; unchanged principal moments and rotations avoid repeated intrinsic axis rotations and products.
   * The physical owner compares copied moment/quaternion components at each segment index; the same token fixes model order without retaining a target-dependent tensor result.
   * Three fresh tensor rows escape. The token retains at most one fixed-size intrinsic record per current segment and releases the reader with all model state.
   */
  export function inertia(prepared: IPrepared, posed: resolveAutoMovieMomentum.IPosed): number[][] {
    return state(prepared).tensor(posed.parts, posed.centre);
  }

  /**
   * Apply the existing two-pose momentum reduction to this model's ordered
   * posed snapshots and a positive interval in seconds. No endpoint is held.
   *
   * States ordered snapshot premise, positive seconds and lack of endpoint retention.
   * Delegates the unchanged chord velocities, shortest-arc spin and orbital-plus-spin sum to resolveAutoMovieMomentum.between with this exact copied model.
   * A live-state lookup and one existing physical reduction introduce no second momentum formula.
   * The original positive-interval check, model order and physical arithmetic remain authoritative.
   * O(S) time for the existing segment sum and fixed-size numeric result; this wrapper adds constant work.
   * Uses the same copied model as the endpoint pose producer; it adds no target-dependent momentum-result cache.
   * Endpoints are borrowed only during the call and the fresh momentum escapes without retaining either pose or token.
   */
  export function between(
    prepared: IPrepared,
    before: resolveAutoMovieMomentum.IPosed,
    after: resolveAutoMovieMomentum.IPosed,
    seconds: number,
  ): resolveAutoMovieMomentum.IMomentum {
    const current: IState = state(prepared);
    return current.interval(current.model, before, after, seconds);
  }

  /**
   * Release all model and last-frame numeric state. Repeated release is safe;
   * every subsequent query through this token throws instead of recreating it.
   *
   * States idempotent release and subsequent-reader failure.
   * Deleting the sole weak-state entry ends this explicit planning epoch without changing completed numeric results.
   * One weak-map deletion owns all prepared model and frame state together.
   * Release never repopulates state or preserves a hidden identity cache.
   * Constant-time state deletion with no segment traversal or pose copy.
   * A repeated release is a no-op; only a new factory call starts another admitted snapshot.
   * Deletes the token's only O(S) numeric state root on success or failure; independently returned numeric records remain valid.
   */
  export function release(prepared: IPrepared): void {
    STATES.delete(prepared);
  }
}

/** One copied model and at most one copied frame per ordered mass segment. */
interface IState {
  /** Immutable copied bone-local SI inputs and their exact total mass. */
  model: resolveAutoMovieCenterOfMass.IModel;

  /** At most one last common-frame numeric dependency row per segment. */
  frames: (IFrame | undefined)[];

  /** Exact intrinsic tensor prerequisites used only by this mass owner. */
  tensor: ReturnType<typeof physicalInertiaTensor.prepare>;

  /** Exact endpoint quaternion prerequisites, without endpoint pose retention. */
  interval: ReturnType<typeof resolveAutoMovieMomentum.prepareIntervals>;
}

/** Last actual bone inputs and their derived numeric mass-point transform. */
interface IFrame {
  /** Last actual bone position, copied in the bones' common frame. */
  position: IAutoMovieVector3;

  /** Last actual bone-to-common rotation, copied as four numeric coordinates. */
  rotation: IAutoMovieQuaternion;

  /** Rotated local mass offset, independent of bone translation. */
  offset: IAutoMovieVector3;

  /** Common-frame segment centre, metres. */
  point: IAutoMovieVector3;

  /** Bone rotation times fixed local principal axes; absent until requested. */
  principal?: IAutoMovieQuaternion;
}

/** A released or foreign handle cannot reach stale planning state. */
function state(prepared: prepareAutoMovieMassModel.IPrepared): IState {
  const current: IState | undefined = STATES.get(prepared);
  if (current === undefined) throw new Error("The prepared mass model has been released or is foreign");
  return current;
}

/** Read each current scalar before deciding whether the numeric transform is equivalent. */
function readFrame(
  current: IState,
  segment: resolveAutoMovieCenterOfMass.ISegment,
  i: number,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): IFrame {
  const bone: IAutoMovieResolvedBone | undefined = bones.get(segment.bone);
  if (bone === undefined) throw new Error(`The momentum needs the posed bone ${segment.bone}`);
  const known: IFrame | undefined = current.frames[i];
  const sameRotation: boolean = known !== undefined &&
    sameVector(known.rotation, bone.worldRotation) && Object.is(known.rotation.w, bone.worldRotation.w);
  if (known !== undefined && sameRotation && sameVector(known.position, bone.worldPosition)) return known;
  const offset: IAutoMovieVector3 = sameRotation
    ? known!.offset
    : Quaternion.rotateVector(bone.worldRotation, segment.point);
  if (known !== undefined) {
    // Returned posed parts copy these fields, so changing the private last
    // frame cannot move an earlier stencil endpoint or caller-owned result.
    known.position.x = bone.worldPosition.x;
    known.position.y = bone.worldPosition.y;
    known.position.z = bone.worldPosition.z;
    known.rotation.x = bone.worldRotation.x;
    known.rotation.y = bone.worldRotation.y;
    known.rotation.z = bone.worldRotation.z;
    known.rotation.w = bone.worldRotation.w;
    known.offset = offset;
    known.point.x = bone.worldPosition.x + offset.x;
    known.point.y = bone.worldPosition.y + offset.y;
    known.point.z = bone.worldPosition.z + offset.z;
    if (!sameRotation) known.principal = undefined;
    return known;
  }
  const frame: IFrame = {
    position: copyVector(bone.worldPosition),
    rotation: copyQuaternion(bone.worldRotation),
    offset,
    point: {
      x: bone.worldPosition.x + offset.x,
      y: bone.worldPosition.y + offset.y,
      z: bone.worldPosition.z + offset.z,
    },
  };
  current.frames[i] = frame;
  return frame;
}

/** Exact coordinates include signed zero and detect caller mutation. */
function sameVector(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return Object.is(a.x, b.x) && Object.is(a.y, b.y) && Object.is(a.z, b.z);
}

/** A fresh three-scalar record crosses the private-state boundary. */
function copyVector(value: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: value.x, y: value.y, z: value.z };
}

/** A fresh four-scalar record crosses the private-state boundary. */
function copyQuaternion(value: IAutoMovieQuaternion): IAutoMovieQuaternion {
  return { x: value.x, y: value.y, z: value.z, w: value.w };
}

/** Every admitted SI coordinate must be finite. */
function finiteVector(value: IAutoMovieVector3): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

/** Finiteness is checked without changing the existing unit-frame premise. */
function finiteQuaternion(value: IAutoMovieQuaternion): boolean {
  return finiteVector(value) && Number.isFinite(value.w);
}

