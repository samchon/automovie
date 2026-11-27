import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMomentum,
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMoviePrincipalTensorFrame,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { AutoMovieEngineMotionSampling } from "../../motion/AutoMovieEngineMotionSampling";
import { AutoMoviePhysicalInertiaTensor } from "../../physics/AutoMoviePhysicalInertiaTensor";
import { physicalPrincipalAxes } from "../../physics/internal/physicalPrincipalAxes";
import { resolveAutoMovieCenterOfMass } from "./resolveAutoMovieCenterOfMass";


/**
 * Companion types and readings of {@link resolveAutoMovieMomentum}: the
 * composite tensor, its principal frame and the posed parts.
 */
export namespace resolveAutoMovieMomentum {
  /** Execute the operation without merging a callable with this namespace. */
  export const run = resolveAutoMovieMomentumRun;
  /**
   * Linear/angular momentum at a measurement instant; the two-pose entry
   * measures at its interval's middle.
   */
  export interface IMomentum {
    /**
     * Whole-body centre at the measurement instant, metres; the interval entry
     * uses the mean of its two endpoint centres.
     */
    centre: IAutoMovieVector3;

    /**
     * The centre's velocity at the measurement instant, metres per second; the
     * interval entry uses its endpoint chord.
     */
    velocity: IAutoMovieVector3;

    /** Whole-body linear momentum in the common frame, kg m/s. */
    linear: IAutoMovieVector3;

    /** Angular momentum about `centre`, kg m짼/s. */
    angular: IAutoMovieVector3;
  }

  /** A tensor's principal frame. */
  export interface IPrincipal {
    /** The principal moments in ascending order, in the tensor's unit. */
    moments: IAutoMovieVector3;

    /**
     * The rotation from the principal frame to the tensor's frame; its columns
     * are the moments' axes.
     */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * One model's parts and whole-body centre at the same posed instant.
   *
   * Both use the bones' common frame and the model's segment order. The caller
   * owns this reduction and must not combine it with a different model or
   * mutate it while its interval or tensor is being read.
   */
  export interface IPosed {
    /** Rigid parts in model order, with SI masses, centres and inertia. */
    parts: readonly IAutoMovieCombinePhysicalMassProperties.IPart[];

    /** Mass-weighted centre in the parts' common frame, metres. */
    centre: IAutoMovieVector3;
  }

  /**
   * Pose each segment and reduce its transformed centre in one ordered pass
   * through the mass model. The returned parts and centre serve interval
   * momentum and composite inertia without a second centre transform. Missing
   * bones retain parts' admission error. The result owns fresh posed records
   * and retains no bone map or reader.
   */
  export function pose(
    model: IAutoMovieResolveCenterOfMass.IModel,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IPosed {
    const posed: IAutoMovieCombinePhysicalMassProperties.IPart[] = [];
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.mean(
      model,
      (segment: IAutoMovieResolveCenterOfMass.ISegment): IAutoMovieVector3 => {
        const part: IAutoMovieCombinePhysicalMassProperties.IPart = posePart(
          segment,
          bones,
        );
        posed.push(part);
        return part.centerOfMass;
      },
    );
    return { parts: posed, centre };
  }

  /**
   * Reduce the interval's momentum from two poses of the same model.
   *
   * Endpoint centres, per-part chords, shortest-arc angular differences,
   * midpoint frames and segment summation order match the bone-map entry.
   * Seconds must be positive; callers supply this model's ordered posed
   * reductions in the same frame. The interval reciprocal serves every rate and
   * scalar orbital coordinates preserve each original product, cross difference
   * and segment addition. Scaling mutates only fresh vector results; neither
   * endpoint is changed or retained by the numeric momentum.
   *
   * States endpoint order, common frame, positive seconds, original arithmetic
   * and fresh-result ownership. The shared reduction uses central chord
   * velocities, shortest-arc angular differences and the sum of each part's
   * orbital and spin angular momentum about the whole-body midpoint centre. The
   * raw entry delegates to the same reduction as the optional prepared interval
   * reader without retaining a workspace. Preserves positive-interval
   * admission, model order, complete orbital/spin contributions and their
   * existing floating-point association. One O(S) segment pass plus
   * constant-size centre and linear-momentum output for S ordered parts; the
   * raw path prepares no cross-query cache. Both endpoints' already transformed
   * centres serve the centre and orbital terms; repeated-query quaternion work
   * is available only through an explicitly owned prepared reader. Borrows
   * endpoints for the synchronous reduction and returns fresh numeric momentum
   * records without holding a pose, model or handle.
   */
  export function between(
    model: IAutoMovieResolveCenterOfMass.IModel,
    before: IPosed,
    after: IPosed,
    seconds: number,
  ): IMomentum {
    return reduceBetween(model, before, after, seconds);
  }

  /**
   * Prepare exact per-segment quaternion differences for one physical plan.
   *
   * Unchanged endpoint principal frames share only their unscaled rotation
   * vector and midpoint frame. Actual time intervals, point chords, masses,
   * moments, spin products and model-order sums are evaluated on every call;
   * unchanged midpoint intrinsic tensors share the physical owner's exact
   * moment/quaternion preparation before those current spin products.
   *
   * States which endpoint prerequisites are retained and which current physical
   * values remain evaluated. The shortest-arc rotation vector of Q1 Q0 inverse
   * and the half-way slerp depend only on the two endpoint rotations; their
   * reuse leaves the original angular-rate division and orbital-plus-spin
   * formula unchanged. A bounded numeric quaternion reader is lent to the
   * single shared interval reduction, while the raw entry computes fresh
   * differences. Reentrant reads use that same uncached reduction so foreign
   * getters cannot overwrite the active outer rate scratch. Exact copied
   * quaternion coordinates are the only reuse key; current velocities, inertia
   * and momentum answers are never replayed or clamped. O(S) current
   * orbital/spin work for S segments. Unchanged endpoint frames omit quaternion
   * inverse/product, logarithm and slerp; unchanged midpoint moments/rotation
   * also omit intrinsic axis rotations. Changed dependencies do their original
   * computations. Retained storage is O(S). Each ordered index captures all
   * eight endpoint coordinates once, then uses that same private tuple for
   * Object.is, inverse/log and slerp. A row becomes reusable only after both
   * results complete. Mutation/signed zero remain visible; current mass, points
   * and interval seconds remain outside this rotation-only key. The caller owns
   * one closure, one active-call guard and at most one numeric interval per
   * current part index; shrinking truncates old entries. Finally releases the
   * guard after success or throw, with no depth pool or retained
   * pose/model/result; the mass token drops this reader on release.
   */
  export function prepareIntervals(): (
    model: IAutoMovieResolveCenterOfMass.IModel,
    before: IPosed,
    after: IPosed,
    seconds: number,
  ) => IMomentum {
    const intervals: (IRotationInterval | undefined)[] = [];
    const tensor: AutoMoviePhysicalInertiaTensor.IPrepared =
      AutoMoviePhysicalInertiaTensor.prepare();
    let active: boolean = false;
    const read: (
      i: number,
      from: IAutoMovieQuaternion,
      to: IAutoMovieQuaternion,
    ) => IRotationInterval = (
      i: number,
      from: IAutoMovieQuaternion,
      to: IAutoMovieQuaternion,
    ): IRotationInterval => {
      const fx: number = from.x;
      const fy: number = from.y;
      const fz: number = from.z;
      const fw: number = from.w;
      const tx: number = to.x;
      const ty: number = to.y;
      const tz: number = to.z;
      const tw: number = to.w;
      const known: IRotationInterval | undefined = intervals[i];
      if (
        known !== undefined &&
        known.ready &&
        Object.is(known.from.x, fx) &&
        Object.is(known.from.y, fy) &&
        Object.is(known.from.z, fz) &&
        Object.is(known.from.w, fw) &&
        Object.is(known.to.x, tx) &&
        Object.is(known.to.y, ty) &&
        Object.is(known.to.z, tz) &&
        Object.is(known.to.w, tw)
      )
        return known;
      if (known !== undefined) known.ready = false;
      const before: IAutoMovieQuaternion = known?.from ?? {
        x: fx,
        y: fy,
        z: fz,
        w: fw,
      };
      const after: IAutoMovieQuaternion = known?.to ?? {
        x: tx,
        y: ty,
        z: tz,
        w: tw,
      };
      before.x = fx;
      before.y = fy;
      before.z = fz;
      before.w = fw;
      after.x = tx;
      after.y = ty;
      after.z = tz;
      after.w = tw;
      const turn: IAutoMovieVector3 = AutoMovieEngineMotionSampling.samplePoseVelocityRotationVector(
        Quaternion.multiply(after, Quaternion.inverse(before)),
      );
      const middle: IAutoMovieQuaternion = Quaternion.slerp(before, after, 0.5);

      // Both computations consume this exact captured key. An existing row
      // stays ineligible for reuse until both numeric results are complete.
      const interval: IRotationInterval = known ?? {
        ready: false,
        from: before,
        to: after,
        turn,
        middle,
        rate: { x: 0, y: 0, z: 0 },
      };
      interval.turn = turn;
      interval.middle = middle;
      interval.ready = true;
      intervals[i] = interval;
      return interval;
    };
    return (
      model: IAutoMovieResolveCenterOfMass.IModel,
      before: IPosed,
      after: IPosed,
      seconds: number,
    ): IMomentum => {
      if (active) return reduceBetween(model, before, after, seconds);
      active = true;
      try {
        intervals.length = before.parts.length;
        return reduceBetween(model, before, after, seconds, read, tensor);
      } finally {
        active = false;
      }
    };
  }

  /**
   * The composite inertia tensor of a posed body about its whole-body centre of
   * mass, in the bones' frame: each segment's principal tensor turned by its
   * bone's rotation times its rest axes and shifted by the parallel-axis
   * theorem (`AutoMoviePhysicalInertiaTensor`).
   *
   * @param model The body's mass model.
   * @param bones The posed bones.
   * @returns The symmetric tensor, kg m짼.
   * @throws {Error} When a segment's bone is not posed.
   */
  export function inertia(
    model: IAutoMovieResolveCenterOfMass.IModel,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number[][] {
    const posed: IPosed = pose(model, bones);
    return AutoMoviePhysicalInertiaTensor.compute(posed.parts, posed.centre);
  }

  /**
   * A tensor's principal moments and axes, by the engine's Jacobi
   * diagonalization; the tensor is copied, not consumed.
   *
   * @param tensor A symmetric 3x3 tensor.
   * @returns Its principal frame.
   * @throws {Error} When every entry is zero.
   */
  export function principal(
    tensor: readonly (readonly number[])[],
  ): IAutoMoviePrincipalTensorFrame {
    return physicalPrincipalAxes(
      tensor.map((row: readonly number[]): number[] => [...row]),
    );
  }

  /**
   * A tensor applied to a vector, `T v`.
   *
   * @param tensor A 3x3 tensor.
   * @param v The vector.
   * @returns The product.
   */
  export function apply(
    tensor: readonly (readonly number[])[],
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const row: (r: readonly number[]) => number = (
      r: readonly number[],
    ): number => r[0]! * v.x + r[1]! * v.y + r[2]! * v.z;
    return { x: row(tensor[0]!), y: row(tensor[1]!), z: row(tensor[2]!) };
  }

  /**
   * Every segment of a model as a rigid part posed by its bone: its centre
   * carried from the bone's frame and its principal axes turned by the bone's
   * rotation.
   *
   * @param model The body's mass model.
   * @param bones The posed bones.
   * @returns The parts, in the bones' frame, in the model's segment order.
   * @throws {Error} When a segment's bone is not posed.
   */
  export function parts(
    model: IAutoMovieResolveCenterOfMass.IModel,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieCombinePhysicalMassProperties.IPart[] {
    return model.segments.map(
      (
        s: IAutoMovieResolveCenterOfMass.ISegment,
      ): IAutoMovieCombinePhysicalMassProperties.IPart => posePart(s, bones),
    );
  }
}

/**
 * Linear and angular momentum of a posed body from two of its poses `seconds`
 * apart, at the interval's middle, read from the mass model
 * `resolveAutoMovieCenterOfMass` builds once per body: every profile segment a
 * rigid part riding its bone, with its mass, centre and principal inertia.
 *
 * Airborne rotation, the response to an impulse and a pair's balance read the
 * momenta and the composite tensor about the centre of mass (#3422). Units are
 * kilograms, metres and seconds: linear momentum in kg m/s, angular momentum in
 * kg m짼/s, in the frame the bones are given in (the world, or a root's own
 * frame when a caller passes root-frame bones).
 *
 * Each segment's velocity is the chord of its centre over the interval and its
 * angular velocity the rotation vector of its relative turn `Q1 Q0?뼘?, taken on
 * the shorter arc (`AutoMovieEngineMotionSampling.samplePoseVelocityRotationVector`), over the interval:
 * both are central differences about the middle, with second-order error in
 * `seconds` for sufficiently smooth segment trajectories. Each segment's
 * position and principal frame are read at the middle (the mean of its centres
 * and the half-way slerp of its frames), and the angular momentum about the
 * middle's centre of mass is `誇 m (c - C) 횞 v + R diag(I) R巢 ?`, the segments'
 * orbital and spin momenta. A rigid turn of the whole body by `罐` over the
 * interval introduces an `O(罐짼)` orbital error through the mean positions and
 * velocity chords. The logarithmic spin rate has no such universal scalar bias,
 * and the complete relative momentum error depends on the mass distribution and
 * motion; this stencil does not certify a relative error budget for a chosen
 * interval.
 *
 * @param model The body's mass model.
 * @param before The posed bones at the interval's start.
 * @param after The posed bones at its end.
 * @param seconds The interval, seconds; positive.
 * @returns The momenta.
 * @throws {Error} When the interval is not positive or a segment's bone is not
 *   posed in both.
 */
function resolveAutoMovieMomentumRun(
  model: IAutoMovieResolveCenterOfMass.IModel,
  before: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  after: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  seconds: number,
): IAutoMovieBodyMomentum {
  if (!(seconds > 0))
    throw new Error(`The momentum needs a positive interval, got ${seconds}`);
  return resolveAutoMovieMomentum.between(
    model,
    resolveAutoMovieMomentum.pose(model, before),
    resolveAutoMovieMomentum.pose(model, after),
    seconds,
  );
}

/**
 * Pose one admitted model segment for both the parts-only and combined
 * reductions. Each centre is fresh; the unchanged model's inertia is shared as
 * before, and no bone map survives in the returned part.
 */
function posePart(
  segment: IAutoMovieResolveCenterOfMass.ISegment,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): IAutoMovieCombinePhysicalMassProperties.IPart {
  const bone: IAutoMovieResolvedBone | undefined = bones.get(segment.bone);
  if (bone === undefined)
    throw new Error(`The momentum needs the posed bone ${segment.bone}`);
  return {
    mass: segment.mass,
    centerOfMass: resolveAutoMovieCenterOfMass.point(segment, bone),
    inertia: segment.inertia,
    inertiaRotation: Quaternion.multiply(bone.worldRotation, segment.axes),
  };
}

/**
 * One ordered momentum reduction serves raw and prepared interval readers. A
 * prepared rotation interval contains only immutable numeric quaternion
 * prerequisites; all current chords, rates, tensor products and sums remain.
 */
function reduceBetween(
  model: IAutoMovieResolveCenterOfMass.IModel,
  before: resolveAutoMovieMomentum.IPosed,
  after: resolveAutoMovieMomentum.IPosed,
  seconds: number,
  readRotation?: (
    i: number,
    from: IAutoMovieQuaternion,
    to: IAutoMovieQuaternion,
  ) => IRotationInterval,
  tensor?: AutoMoviePhysicalInertiaTensor.IPrepared,
): IAutoMovieBodyMomentum {
  if (!(seconds > 0))
    throw new Error(`The momentum needs a positive interval, got ${seconds}`);
  const reciprocal: number = 1 / seconds;
  const centre: IAutoMovieVector3 = Vector3.add(before.centre, after.centre);
  centre.x *= 0.5;
  centre.y *= 0.5;
  centre.z *= 0.5;
  const velocity: IAutoMovieVector3 = Vector3.subtract(
    after.centre,
    before.centre,
  );
  velocity.x *= reciprocal;
  velocity.y *= reciprocal;
  velocity.z *= reciprocal;

  // Orbital plus spin momentum of each segment at the interval's middle.
  let angularX: number = 0;
  let angularY: number = 0;
  let angularZ: number = 0;
  for (let i: number = 0; i < before.parts.length; i++) {
    const p0: IAutoMovieCombinePhysicalMassProperties.IPart = before.parts[i]!;
    const p1: IAutoMovieCombinePhysicalMassProperties.IPart = after.parts[i]!;

    // Retain mean-then-offset and chord-then-reciprocal association.
    const x: number = (p0.centerOfMass.x + p1.centerOfMass.x) * 0.5 - centre.x;
    const y: number = (p0.centerOfMass.y + p1.centerOfMass.y) * 0.5 - centre.y;
    const z: number = (p0.centerOfMass.z + p1.centerOfMass.z) * 0.5 - centre.z;
    const vx: number = (p1.centerOfMass.x - p0.centerOfMass.x) * reciprocal;
    const vy: number = (p1.centerOfMass.y - p0.centerOfMass.y) * reciprocal;
    const vz: number = (p1.centerOfMass.z - p0.centerOfMass.z) * reciprocal;
    const rotation: IRotationInterval | undefined = readRotation?.(
      i,
      p0.inertiaRotation,
      p1.inertiaRotation,
    );
    const w: IAutoMovieVector3 =
      rotation === undefined
        ? AutoMovieEngineMotionSampling.samplePoseVelocityRotationVector(
            Quaternion.multiply(
              p1.inertiaRotation,
              Quaternion.inverse(p0.inertiaRotation),
            ),
          )
        : rotation.rate;
    if (rotation !== undefined) {
      w.x = rotation.turn.x;
      w.y = rotation.turn.y;
      w.z = rotation.turn.z;
    }
    w.x *= reciprocal;
    w.y *= reciprocal;
    w.z *= reciprocal;
    const middle: IAutoMovieQuaternion =
      rotation?.middle ??
      Quaternion.slerp(p0.inertiaRotation, p1.inertiaRotation, 0.5);
    const spin: IAutoMovieVector3 =
      tensor === undefined
        ? AutoMoviePhysicalInertiaTensor.spin(p0, middle, w)
        : tensor.spin(before.parts, i, middle, w);

    // m ((middle - centre) cross velocity) + spin, followed by the same
    // left-to-right model-order addition as the vector accumulation.
    angularX += (y * vz - z * vy) * p0.mass + spin.x;
    angularY += (z * vx - x * vz) * p0.mass + spin.y;
    angularZ += (x * vy - y * vx) * p0.mass + spin.z;
  }
  return {
    centre,
    velocity,
    linear: Vector3.scale(velocity, model.mass),
    angular: { x: angularX, y: angularY, z: angularZ },
  };
}

/** Numeric prerequisites of one exact endpoint principal-frame pair. */
interface IRotationInterval {
  /** False until both numeric prerequisites finish from this captured key. */
  ready: boolean;

  /** Copied start principal-to-common quaternion. */
  from: IAutoMovieQuaternion;

  /** Copied end principal-to-common quaternion. */
  to: IAutoMovieQuaternion;

  /** Unscaled shortest-arc difference, radians, before interval division. */
  turn: IAutoMovieVector3;

  /** Half-way principal frame used for the intrinsic momentum tensor. */
  middle: IAutoMovieQuaternion;

  /**
   * Current interval-rate scratch, overwritten before use and never returned or
   * used as a cache key.
   */
  rate: IAutoMovieVector3;
}
