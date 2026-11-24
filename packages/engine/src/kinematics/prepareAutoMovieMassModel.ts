import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMomentum,
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import type { resolveAutoMovieBoneRates } from "./resolveAutoMovieBoneRates";
import { resolveAutoMovieCenterOfMass } from "./resolveAutoMovieCenterOfMass";
import { resolveAutoMovieMomentum } from "./resolveAutoMovieMomentum";
import { resolveAutoMovieMomentumRates } from "./resolveAutoMovieMomentumRates";

/**
 * Snapshot one mass model for a synchronous physical planning operation.
 *
 * Call release in finally after the last inertia, momentum or centre query.
 * Preparation validates finite SI model values and copies every local numeric
 * prerequisite. A prepared model therefore keeps its meaning if its source is
 * edited, while every requested posed bone is still read at its actual value. A
 * getter may reenter this owner. Nested reads use the existing uncached
 * formulas instead of overwriting the outer call's frame or interval scratch.
 */
export function prepareAutoMovieMassModel(
  source: IAutoMovieResolveCenterOfMass.IModel,
): prepareAutoMovieMassModel.IPrepared {
  const segments: IAutoMovieResolveCenterOfMass.ISegment[] =
    source.segments.map(
      (
        segment: IAutoMovieResolveCenterOfMass.ISegment,
      ): IAutoMovieResolveCenterOfMass.ISegment => {
        const copied: IAutoMovieResolveCenterOfMass.ISegment = {
          bone: segment.bone,
          mass: segment.mass,
          point: copyVector(segment.point),
          inertia: copyVector(segment.inertia),
          axes: copyQuaternion(segment.axes),
        };
        if (
          copied.mass < 0 ||
          copied.inertia.x < 0 ||
          copied.inertia.y < 0 ||
          copied.inertia.z < 0 ||
          !(
            Math.hypot(
              copied.axes.x,
              copied.axes.y,
              copied.axes.z,
              copied.axes.w,
            ) > 0
          )
        )
          throw new Error(
            `The prepared mass model needs finite physical data for ${copied.bone}`,
          );
        return copied;
      },
    );
  const mass: number = segments.reduce(
    (sum: number, segment: IAutoMovieResolveCenterOfMass.ISegment): number =>
      sum + segment.mass,
    0,
  );
  if (!(mass > 0 && Object.is(mass, source.mass)))
    throw new Error(
      "The prepared mass model needs its finite positive segment mass sum",
    );
  return {
    model: { mass, segments },
    active: false,
    tensor: physicalInertiaTensor.prepare(),
    interval: resolveAutoMovieMomentum.prepareIntervals(),
  };
}

/** Readers of an explicitly owned mass-model snapshot. */
export namespace prepareAutoMovieMassModel {
  /**
   * An operation-owned handle, invalid after release; it exposes no numeric
   * cache.
   *
   * States operation ownership and invalidation after release. A private
   * nominal symbol identifies one admitted SI mass-model epoch without exposing
   * mutable physical data. The factory and numeric readers exchange only this
   * handle; every model value stays private. Callers cannot structurally
   * construct the token, and live weak-state admission rejects a foreign or
   * released token at runtime.
   */
  export interface IPrepared {
    /** Immutable copied bone-local SI inputs and their exact total mass. */
    readonly model: IAutoMovieResolveCenterOfMass.IModel;

    /**
     * Nested foreign reads use plain formulas instead of borrowing the shared
     * workspaces.
     */
    active: boolean;

    /** Exact intrinsic workspace, made with the model. */
    readonly tensor: ReturnType<typeof physicalInertiaTensor.prepare>;

    /** Exact endpoint workspace, made with the model. */
    readonly interval: ReturnType<
      typeof resolveAutoMovieMomentum.prepareIntervals
    >;
  }

  /**
   * The segment-bearing bones of this model, for demand-driven FK. The fresh
   * set is caller-owned and can be changed without changing the preparation.
   * Ancestors remain the FK owner's responsibility.
   *
   * States mass-bearing bone scope, fresh-set ownership and ancestor ownership.
   * The exact set of declared mass-segment bone names is sufficient for the
   * existing segmental mass formulas. One model-state lookup and a set
   * construction retain the existing names without a new hierarchy owner. No
   * segment is filtered by size or mass, and FK still owns every needed
   * ancestor. One O(S) traversal and O(U) fresh set storage for S segments on U
   * bones, without a mapped S-entry intermediate array; paid once by the flight
   * consumer. Reads this token's immutable model snapshot; the returned set is
   * independent of its private model and later caller edits. The caller owns
   * the fresh set; the function stores no additional population or handle.
   */
  export function bones(
    prepared: IPrepared,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    const names: Set<AutoMovieHumanoidBone> = new Set();
    for (const segment of prepared.model.segments) names.add(segment.bone);
    return names;
  }

  /**
   * Read fresh rigid parts and their ordered mass-weighted centre in the
   * supplied bones' common frame. Exact unchanged frames reuse only their
   * private point and principal-frame transforms, never caller-owned records.
   *
   * States common-frame SI output, ordered parts, fresh records and exact
   * scalar reuse. A mass point follows its bone position and unit rotation, its
   * principal frame is the bone rotation times fixed local axes, and the
   * existing ordered mass mean gives the centre. One model-order mean pass
   * reads each private frame and assembles fresh public parts at the same
   * visit. Missing bones throw and every requested transform is compared by its
   * actual numeric components; no time or pose identity replaces the frame.
   * O(S) scalar comparisons and fresh parts for S segments; only changed
   * rotation requires local offset and principal quaternion products. Copied
   * model properties and exact copied frame coordinates identify equivalent
   * transforms; caller changes to returned centres, inertia or quaternions
   * cannot alter the private prerequisites. The caller owns the fresh O(S)
   * parts and centre. The token retains only one last numeric frame per segment
   * until release, with no bone map or pose population.
   */
  export function pose(
    prepared: IPrepared,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): resolveAutoMovieMomentum.IPosed {
    const parts: IAutoMovieCombinePhysicalMassProperties.IPart[] = [];
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.mean(
      prepared.model,
      (segment: IAutoMovieResolveCenterOfMass.ISegment): IAutoMovieVector3 => {
        const bone: IAutoMovieResolvedBone = posedBone(bones, segment);
        const point: IAutoMovieVector3 = placePoint(bone, segment);
        parts.push({
          mass: segment.mass,
          centerOfMass: copyVector(point),
          inertia: copyVector(segment.inertia),
          inertiaRotation: Quaternion.multiply(
            bone.worldRotation,
            segment.axes,
          ),
        });
        return point;
      },
    );
    return { parts, centre };
  }

  /**
   * The centre in the actual bones' common frame, metres. A centre-only demand
   * does not compute principal frames or allocate rigid-part records.
   *
   * States frame, metres and centre-only demand behavior. Uses the same
   * segmental mass mean and local-to-common point transform as pose and
   * ordinary centre placement. One shared frame reader feeds the existing
   * ordered mean without assembling unused inertia fields. Every segment
   * remains in the sum and missing bones throw rather than supplying a guessed
   * centre. O(S) comparisons and accumulation, with one fresh result and no
   * per-segment output part allocation. Shares exact numeric point
   * prerequisites with pose under the same immutable model snapshot and copied
   * frame keys. Returns one fresh point and retains no additional query state;
   * the token owns its O(S) last-frame data until release.
   */
  export function place(
    prepared: IPrepared,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 {
    return resolveAutoMovieCenterOfMass.mean(
      prepared.model,
      (segment: IAutoMovieResolveCenterOfMass.ISegment): IAutoMovieVector3 =>
        placePoint(posedBone(bones, segment), segment),
    );
  }

  /**
   * The actual posed composite tensor about its own centre, kg m squared. Only
   * the intrinsic rotation prerequisites share exact numeric work; every
   * current mass shift and segment-order sum is performed again.
   *
   * States tensor units, centre and which current contributions remain
   * evaluated. Delegates R diag(I) R transpose and the parallel-axis sum to the
   * physical tensor owner's prepared reader; translated centres never enter an
   * intrinsic tensor's equivalence key. A live lookup lazily acquires the
   * operation's tensor reader at its first actual tensor query, then supplies
   * the existing posed parts and centre. No inertia term, shift or physical
   * check is omitted, and no symmetric-entry copy changes the original
   * arithmetic. O(S) comparisons and ordered sums for S parts; unchanged
   * principal moments and rotations avoid repeated intrinsic axis rotations and
   * products. The physical owner compares copied moment/quaternion components
   * at each segment index; the same token fixes model order without retaining a
   * target-dependent tensor result. Three fresh tensor rows escape. The token
   * retains at most one fixed-size intrinsic record per current segment and
   * releases the reader with all model state.
   */
  export function inertia(
    prepared: IPrepared,
    posed: resolveAutoMovieMomentum.IPosed,
  ): number[][] {
    if (prepared.active)
      return physicalInertiaTensor(posed.parts, posed.centre);
    prepared.active = true;
    try {
      return prepared.tensor(posed.parts, posed.centre);
    } finally {
      prepared.active = false;
    }
  }

  /**
   * Apply the existing two-pose momentum reduction to this model's ordered
   * posed snapshots and a positive interval in seconds. No endpoint is held.
   *
   * States ordered snapshot premise, positive seconds and lack of endpoint
   * retention. Delegates the unchanged chord velocities, shortest-arc spin and
   * orbital-plus-spin sum to resolveAutoMovieMomentum.between with this exact
   * copied model. A live lookup lazily acquires the interval workspace on its
   * first actual momentum query; the existing physical reduction introduces no
   * second formula. The original positive-interval check, model order and
   * physical arithmetic remain authoritative. O(S) time for the existing
   * segment sum and fixed-size numeric result; this wrapper adds constant work.
   * Uses the same copied model as the endpoint pose producer; it adds no
   * target-dependent momentum-result cache. Endpoints are borrowed only during
   * the call and the fresh momentum escapes without retaining either pose or
   * token.
   */
  export function between(
    prepared: IPrepared,
    before: resolveAutoMovieMomentum.IPosed,
    after: resolveAutoMovieMomentum.IPosed,
    seconds: number,
  ): IAutoMovieBodyMomentum {
    if (prepared.active)
      return resolveAutoMovieMomentum.between(
        prepared.model,
        before,
        after,
        seconds,
      );
    prepared.active = true;
    try {
      return prepared.interval(prepared.model, before, after, seconds);
    } finally {
      prepared.active = false;
    }
  }

  /**
   * Instantaneous momentum of this exact owned model and its current posed/rate
   * snapshot. No source, rate map or result is retained.
   */
  export function rates(
    prepared: IPrepared,
    posed: resolveAutoMovieMomentum.IPosed,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    rates: ReadonlyMap<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate>,
  ): IAutoMovieBodyMomentum {
    return resolveAutoMovieMomentumRates(prepared.model, posed, bones, rates);
  }

  /**
   * Release all model and last-frame numeric state. Repeated release is safe;
   * every subsequent query through this token throws instead of recreating it.
   *
   * States idempotent release and subsequent-reader failure. Deleting the sole
   * weak-state entry ends this explicit planning epoch without changing
   * completed numeric results. One weak-map deletion owns all prepared model
   * and frame state together. Release never repopulates state or preserves a
   * hidden identity cache. Constant-time state deletion with no segment
   * traversal or pose copy. A repeated release is a no-op; only a new factory
   * call starts another admitted snapshot. Deletes the token's only O(S)
   * numeric state root on success or failure; independently returned numeric
   * records remain valid.
   */
  export function release(_prepared: IPrepared): void {
    // The model state lives and dies with its handle; nothing is registered.
  }
}

/** The posed bone a segment rides on; a missing bone throws. */
function posedBone(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  segment: IAutoMovieResolveCenterOfMass.ISegment,
): IAutoMovieResolvedBone {
  const bone: IAutoMovieResolvedBone | undefined = bones.get(segment.bone);
  if (bone === undefined)
    throw new Error(`The momentum needs the posed bone ${segment.bone}`);
  return bone;
}

/** The segment's centre in the bones' common frame, metres. */
function placePoint(
  bone: IAutoMovieResolvedBone,
  segment: IAutoMovieResolveCenterOfMass.ISegment,
): IAutoMovieVector3 {
  const offset: IAutoMovieVector3 = Quaternion.rotateVector(
    bone.worldRotation,
    segment.point,
  );
  return {
    x: bone.worldPosition.x + offset.x,
    y: bone.worldPosition.y + offset.y,
    z: bone.worldPosition.z + offset.z,
  };
}

/** A fresh three-scalar record crosses the private-state boundary. */
function copyVector(value: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: value.x, y: value.y, z: value.z };
}

/** A fresh four-scalar record crosses the private-state boundary. */
function copyQuaternion(value: IAutoMovieQuaternion): IAutoMovieQuaternion {
  return { x: value.x, y: value.y, z: value.z, w: value.w };
}
