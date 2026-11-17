import type { AutoMovieHumanoidBone, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { prepareAutoMovieMassModel } from "../kinematics/prepareAutoMovieMassModel";
import type { resolveAutoMovieCenterOfMass } from "../kinematics/resolveAutoMovieCenterOfMass";
import { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { Vector3 } from "../math/Vector3";
import { Quaternion } from "../math/Quaternion";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import type { physicalInertiaFactor } from "../physics/physicalInertiaFactor";
import { AirborneShapeInertia } from "./AirborneShapeInertia";
import { AirborneShapeStatistics } from "./AirborneShapeStatistics";
import type { integrateAirborneRotation } from "./integrateAirborneRotation";

/** The numeric sufficient statistics that survive a shape query. */
type IInstant = integrateAirborneRotation.IInstant;

/** The public query signature, shared without a second state model. */
type IHistory = integrateAirborneRotation.IHistory;

/** The memo's explicit owner can clear it after planning. */
type ICachedHistory = integrateAirborneRotation.ICachedHistory;

/** Only actual numeric instants issued by this factory have prepared ownership. */
const PRINCIPAL: WeakMap<IInstant, IPrincipalOwner | IPrincipalInverse> = new WeakMap();

/** Only native readers issued by this pure-history owner may opt into stage reuse. */
const HISTORIES: WeakSet<IHistory> = new WeakSet();

/** One shape epoch can share an unchanged adjacent principal rotation. */
interface IPrincipalOwner {
  /** An uncomputed instant initially points at its existing history owner. */
  kind: "owner";

  /** Last numeric inverse, with no body, shape callback or pose retained. */
  previous?: IPrincipalInverse;
}

/** A copied scalar dependency key prevents caller edits from certifying stale work. */
interface IPrincipalInverse {
  /** Distinguishes an actual computed inverse from its lazy owner. */
  kind: "inverse";

  /** Fixed-size reuse state for the same shape epoch. */
  owner: IPrincipalOwner;

  /** Exact principal-to-root coordinates that produced back. */
  rotation: IAutoMovieQuaternion;

  /** Root-to-principal rotation from the existing inverse owner. */
  back: IAutoMovieQuaternion;
}

/**
 * Reduce pure root-frame shapes to exact-time inertia and relative momentum.
 *
 * Difference is the existing central half-interval in seconds. A span moves
 * its stencil inside the flight and preserves the quadratic one-sided
 * correction at either boundary. The model and pure shape stay unchanged
 * throughout the reuse epoch. An optional prepared model is borrowed; its
 * caller releases it after clearing this history, including on refusal.
 * An optional native observer records cumulative owner-event populations;
 * omitted, no counter record or per-query instrumentation value is allocated.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States root-frame shape, difference seconds, quadratic boundary stencil and separate history/model ownership. Namespace factor lends an unobserved issued tensor operator with undefined fallback; inverse lends a root-to-principal quaternion only after actual copied-coordinate checks; owned recognizes the native pure reader without claiming smoothness. Optional native observation counts owner events without callbacks.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the existing physical tensor and two-pose rigid-body momentum formula with its unchanged quadratic boundary correction. Unobserved issued tensors use the physical SPD owner, public principal values retain Jacobi/inverse arithmetic, and the takeoff stage-sharing predicate proves only native pure-history construction, never a constant or smooth shape.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One exact-node reader and momentum reducer serve this history. AirborneShapeInertia owns lazy tensor/principal authority, factor lookup and release; the namespace delegates that capability, preserves the principal inverse owner, and recognizes native readers through one private weak set.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every new exact node evaluates the actual pure shape without rounded time, interpolation, a reduced stencil or changed physical bound. Factor reuse additionally requires an intact unobserved accessor, inverse reuse compares all four copied quaternion coordinates, and foreign callbacks/wrappers acquire no trusted native-reader flag.
 * @evidence contracts/development/implementation.md#efficient-algorithms For N queried instants and S parts, at most 3N+6 numeric nodes each perform actual shape/IK/FK once and each new reduction is O(S). Factor consumers omit Jacobi; public principal demand computes it once per instant. Namespace queries add constant weak lookups and accessor/scalar comparisons, while omitted observation allocates no counter or query record. Runtime gains remain unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact times under the same unchanged model, pure shape and span share numeric nodes and I/h. Private moment/principal vectors share only after actual Object.is matches. Each unobserved tensor shares its own factor independently of current attitude/momentum; inverse sharing requires current copied quaternion equality. Native-reader provenance permits checked stage reuse, not a smoothness certificate or cached IK answer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources History owns O(N*S) numeric mass nodes, O(N) instants with nine tensor scalars and optional factor/principal/inverse data, two boundary moments and O(S) last-vector references. Clear empties every map/list, unregisters instants and explicitly releases factor/accessor/statistics references. Old externally held instants retain numeric public materialization data only. Weak history membership retains no reader; callers separately release the O(S) mass model.
 */
export function AirborneShapeHistory(
  model: resolveAutoMovieCenterOfMass.IModel | prepareAutoMovieMassModel.IPrepared,
  shape: (seconds: number) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  difference: number,
  span?: { from: number; to: number },
  observation?: AirborneShapeStatistics.IObserver,
): ICachedHistory {
  const statistics: AirborneShapeStatistics.IStatistics | undefined = AirborneShapeStatistics.borrow(observation);
  const instants: Map<number, IInstant> = new Map();
  const poses: Map<number, resolveAutoMovieMomentum.IPosed> = new Map();
  const intrinsicMoments: (IAutoMovieVector3 | undefined)[] = [];
  const principalRotations: (IAutoMovieQuaternion | undefined)[] = [];
  const principal: IPrincipalOwner = { kind: "owner" };
  const limits: typeof span = span === undefined ? undefined : { to: span.to, from: span.from };
  const delta: number = limits === undefined
    ? difference
    : Math.min(difference, (limits.to - limits.from) / 2);
  const stencil: {
    from: number;
    to: number;
    lower: number;
    upper: number;
  } | undefined = limits === undefined ? undefined : {
    from: limits.from,
    to: limits.to,
    lower: limits.from + delta,
    upper: limits.to - delta,
  };
  const prepared: prepareAutoMovieMassModel.IPrepared | undefined =
    "segments" in model ? undefined : model;
  if (prepared !== undefined) prepareAutoMovieMassModel.bones(prepared);

  // The mass snapshot and its interval reduction are selected together;
  // an unrelated raw model cannot be paired with a prepared token.
  const pose: (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ) => resolveAutoMovieMomentum.IPosed = "segments" in model
    ? (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): resolveAutoMovieMomentum.IPosed =>
        resolveAutoMovieMomentum.pose(model, bones)
    : (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): resolveAutoMovieMomentum.IPosed =>
        prepareAutoMovieMassModel.pose(model, bones);
  const interval: (
    before: resolveAutoMovieMomentum.IPosed,
    after: resolveAutoMovieMomentum.IPosed,
    seconds: number,
  ) => resolveAutoMovieMomentum.IMomentum = "segments" in model
    ? (before: resolveAutoMovieMomentum.IPosed, after: resolveAutoMovieMomentum.IPosed, seconds: number): resolveAutoMovieMomentum.IMomentum =>
        resolveAutoMovieMomentum.between(model, before, after, seconds)
    : (before: resolveAutoMovieMomentum.IPosed, after: resolveAutoMovieMomentum.IPosed, seconds: number): resolveAutoMovieMomentum.IMomentum =>
        prepareAutoMovieMassModel.between(model, before, after, seconds);
  const tensor: (posed: resolveAutoMovieMomentum.IPosed) => number[][] = "segments" in model
    ? (posed: resolveAutoMovieMomentum.IPosed): number[][] => physicalInertiaTensor(posed.parts, posed.centre)
    : (posed: resolveAutoMovieMomentum.IPosed): number[][] => prepareAutoMovieMassModel.inertia(model, posed);

  // Only the two boundary stencils recur at different query times.
  // Their numeric moments are sufficient; their bones need not survive.
  const boundaries: Map<
    number,
    { central: IAutoMovieVector3; change: IAutoMovieVector3 }
  > = new Map();

  // A pure shape's sufficient numeric node belongs to this entire history,
  // including endpoints revisited after other stages or shooting trials.
  // Raw bones and canonical poses do not enter this operation-owned map.
  const read: (at: number) => resolveAutoMovieMomentum.IPosed = (
    at: number,
  ): resolveAutoMovieMomentum.IPosed => {
    const known: resolveAutoMovieMomentum.IPosed | undefined = poses.get(at);
    if (known !== undefined) return known;
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = shape(at);
    const posed: resolveAutoMovieMomentum.IPosed = pose(bones);

    // Nodes never escape this history. Their fixed moments can share a
    // private numeric copy, while public pose outputs keep their isolation.
    intrinsicMoments.length = posed.parts.length;
    principalRotations.length = posed.parts.length;
    for (let i: number = 0; i < posed.parts.length; i++) {
      const part: resolveAutoMovieMomentum.IPosed["parts"][number] = posed.parts[i]!;
      let fixed: IAutoMovieVector3 | undefined = intrinsicMoments[i];
      if (fixed === undefined ||
          !Object.is(fixed.x, part.inertia.x) || !Object.is(fixed.y, part.inertia.y) ||
          !Object.is(fixed.z, part.inertia.z)) {
        fixed = { x: part.inertia.x, y: part.inertia.y, z: part.inertia.z };
        intrinsicMoments[i] = fixed;
      }
      part.inertia = fixed;

      // Both actual pose producers create a fresh principal quaternion. It
      // can share an equal private predecessor without retaining raw bones.
      const rotation: IAutoMovieQuaternion | undefined = principalRotations[i];
      if (rotation !== undefined && sameRotation(rotation, part.inertiaRotation))
        part.inertiaRotation = rotation;
      else principalRotations[i] = part.inertiaRotation;
    }
    poses.set(at, posed);
    if (statistics !== undefined) statistics.uniqueNumericNodes++;
    return posed;
  };
  const momentum: (from: number, to: number) => IAutoMovieVector3 = (
    from: number,
    to: number,
  ): IAutoMovieVector3 => {
    const before: resolveAutoMovieMomentum.IPosed = read(from);
    const after: resolveAutoMovieMomentum.IPosed = read(to);
    return interval(before, after, to - from).angular;
  };
  const evaluate: (seconds: number) => IInstant = (
    seconds: number,
  ): IInstant => {
    const posed: resolveAutoMovieMomentum.IPosed = read(seconds);
    const matrix: number[][] = tensor(posed);

    // Preserve the principal owner's existing zero/NaN-tensor admission
    // before any additional stencil shape can throw its own failure.
    let scale: number = Number.NEGATIVE_INFINITY;
    for (const row of matrix)
      for (const value of row) scale = Math.max(scale, Math.abs(value));
    if (!(scale > 0)) throw new Error("Invalid aggregate inertia tensor");
    if (stencil === undefined)
      return AirborneShapeInertia(matrix, momentum(seconds - difference, seconds + difference), statistics);
    const centre: number = Math.max(
      stencil.lower,
      Math.min(stencil.upper, seconds),
    );
    const a: number = Math.max(stencil.from, centre - delta);
    const b: number = Math.min(stencil.to, centre + delta);
    if (centre === seconds) return AirborneShapeInertia(matrix, momentum(a, b), statistics);
    let boundary:
      | { central: IAutoMovieVector3; change: IAutoMovieVector3 }
      | undefined = boundaries.get(centre);
    if (boundary === undefined) {
      boundary = {
        central: momentum(a, b),
        change: Vector3.subtract(momentum(centre, b), momentum(a, centre)),
      };
      boundaries.set(centre, boundary);
    }
    return AirborneShapeInertia(matrix,
      Vector3.add(
        boundary.central,
        Vector3.scale(boundary.change, (2 * (seconds - centre)) / (b - a)),
      ),
      statistics,
    );
  };
  const query: IHistory = (seconds: number): IInstant => {
    if (statistics !== undefined) statistics.queries++;
    const known: IInstant | undefined = instants.get(seconds);
    if (known !== undefined) {
      if (statistics !== undefined) statistics.memoHits++;
      return known;
    }
    const instant: IInstant = evaluate(seconds);
    PRINCIPAL.set(instant, principal);
    instants.set(seconds, instant);
    return instant;
  };
  HISTORIES.add(query);
  return Object.assign(query, {
    clear: (): void => {
      for (const instant of instants.values()) {
        PRINCIPAL.delete(instant);
        AirborneShapeInertia.release(instant);
      }
      instants.clear();
      poses.clear();
      intrinsicMoments.length = 0;
      principalRotations.length = 0;
      boundaries.clear();
      principal.previous = undefined;
    },
  });
}

/**
 * Exact numeric prerequisites private to instants produced by this owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The inverse reader distinguishes factory-issued instants from general history outputs and documents copied coordinate invalidation.
 * @evidence contracts/development/design.md#principled-representation The prepared quantity is the principal-to-root quaternion's inverse, independent of world orientation, conserved momentum and shooting target.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The ODE and dense momentum reconstruction share this numeric prerequisite from the actual instant they already read; neither caller can install or forge its private ownership registration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts General history outputs retain their original path, and an issued instant's actual quaternion coordinates must still match before reuse; no public prepared-value flag is trusted.
 */
export namespace AirborneShapeHistory {
  /**
   * Borrow the issued instant's tensor factor before public principal access.
   * Undefined preserves the principal path for foreign, observed, replaced or
   * non-SPD instants. Returned operators expose no mutable numerical storage.
   *
   */
  export function factor(instant: IInstant): physicalInertiaFactor.IPrepared | undefined {
    return AirborneShapeInertia.factor(instant);
  }

  /**
   * Recognize this factory's native pure-history reader for operation-local
   * stage sharing. It proves construction, not smoothness or constant shape.
   *
   */
  export function owned(history: IHistory): boolean {
    return HISTORIES.has(history);
  }

  /**
   * Read an issued instant's root-to-principal rotation, or leave a general
   * history output to its existing computation. The returned internal value
   * is borrowed and must not be mutated; its actual coordinates are checked
   * against the copied key on every read.
   *
   * States frames, unissued-output absence, copied coordinate validation and borrowed immutable result ownership.
   * Uses the existing Quaternion.inverse on the same principal rotation; this inverse is shape-only and is independent of the ODE's momentum, attitude and tangent directions.
   * A private issued-instant registration lends its history's fixed-size last-value owner until the inverse is actually demanded; unissued outputs return undefined for the caller's original fallback.
   * Instant identity establishes only private provenance; every copied quaternion coordinate must additionally match the actual requested principal rotation before reusing numeric work.
   * One weak lookup and four scalar comparisons per read, with one inverse for a new rotation. New instants initially share their owner without per-instant state allocation; unchanged rotations share one computed numeric record.
   * The history's existing exact-time I/h memo already selects the same issued instant across trials. Copied quaternion checks also detect mutation and signed zero; adjacent exact rotations share the owner's last inverse independently of momentum and target.
   * Only the history's N issued numeric instants have weak registrations. clear deletes each registration and forgets the one last record in O(N), and dropping the history also releases its weak keys. No callback, body, model or posed history is retained by this numeric registry.
   */
  export function inverse(
    instant: IInstant,
  ): IAutoMovieQuaternion | undefined {
    const current: IPrincipalOwner | IPrincipalInverse | undefined = PRINCIPAL.get(instant);
    if (current === undefined) return undefined;
    const rotation: IAutoMovieQuaternion = instant.inertia.rotation;
    if (current.kind === "inverse" && sameRotation(current.rotation, rotation)) {
      current.owner.previous = current;
      return current.back;
    }
    const owner: IPrincipalOwner = current.kind === "owner" ? current : current.owner;
    const previous: IPrincipalInverse | undefined = owner.previous;
    if (previous !== undefined && sameRotation(previous.rotation, rotation)) {
      PRINCIPAL.set(instant, previous);
      return previous.back;
    }
    const copied: IAutoMovieQuaternion = { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w };
    const value: IPrincipalInverse = { kind: "inverse", owner, rotation: copied, back: Quaternion.inverse(copied) };
    PRINCIPAL.set(instant, value);
    owner.previous = value;
    return value.back;
  }
}

/** Component identity preserves signed zeros and observes edits to mutable instant records. */
function sameRotation(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean {
  return Object.is(a.x, b.x) && Object.is(a.y, b.y) && Object.is(a.z, b.z) && Object.is(a.w, b.w);
}


