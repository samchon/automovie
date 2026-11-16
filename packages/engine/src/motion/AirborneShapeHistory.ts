import type { AutoMovieHumanoidBone, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { prepareAutoMovieMassModel } from "../kinematics/prepareAutoMovieMassModel";
import type { resolveAutoMovieCenterOfMass } from "../kinematics/resolveAutoMovieCenterOfMass";
import { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { Vector3 } from "../math/Vector3";
import { Quaternion } from "../math/Quaternion";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import { physicalPrincipalAxes } from "../physics/physicalPrincipalAxes";
import type { integrateAirborneRotation } from "./integrateAirborneRotation";

/** The numeric sufficient statistics that survive a shape query. */
type IInstant = integrateAirborneRotation.IInstant;

/** The public query signature, shared without a second state model. */
type IHistory = integrateAirborneRotation.IHistory;

/** The memo's explicit owner can clear it after planning. */
type ICachedHistory = integrateAirborneRotation.ICachedHistory;

/** Only actual numeric instants issued by this factory have prepared ownership. */
const PRINCIPAL: WeakMap<IInstant, IPrincipalOwner | IPrincipalInverse> = new WeakMap();

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

/** One exact tensor key and independently owned principal numbers for this shape epoch. */
interface IPrincipalTensor {
  /** False while a changed matrix is being consumed, including after a failed eigensolve. */
  ready: boolean;

  /** Copied row-major entries before Jacobi consumes the tensor. */
  matrix: number[];

  /** Private scalar output; returned history records never alias these vectors. */
  value: IInstant["inertia"];
}

/**
 * Reduce pure root-frame shapes to exact-time inertia and relative momentum.
 *
 * Difference is the existing central half-interval in seconds. A span moves
 * its stencil inside the flight and preserves the quadratic one-sided
 * correction at either boundary. The model and pure shape stay unchanged
 * throughout the reuse epoch. An optional prepared model is borrowed; its
 * caller releases it after clearing this history, including on refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States root-frame shape, difference seconds, boundary correction and separate history/model ownership. Namespace inverse reads only factory-issued instants, returns undefined for a general history output, validates copied principal coordinates and lends an immutable root-to-principal value to the ODE/dense consumers.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the existing physical tensor and principal-axis owners and the same two-pose rigid-body momentum formula; boundary correction retains the derivative of the quadratic interpolant with the unchanged difference interval.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Select the model's pose and interval reducers together, then share one exact numeric-node reader and momentum reducer across this history's entire operation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every first demanded exact shape node evaluates the actual pure shape; no interpolation, time quantization, reduced stencil or changed physical check replaces it. Only numeric mass parts and their centre survive that read. Private issued-instant provenance plus actual quaternion checks, never a public prepared flag, establish inverse reuse.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each query uses at most four distinct numeric nodes and O(S) mass work. Across N distinct I/h queries, at most 3N+6 exact nodes each perform shape/IK/FK once, including repeated endpoints separated by other queries/trials. One last exact 3x3 tensor can additionally omit Jacobi after nine matches; actual sums/stencils remain. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact time under this unchanged pure shape/model/span fixes numeric mass parts and I/h, sharing any previous endpoint without an eviction distance. The private nodes additionally share owned principal-moment vectors only after three Object.is matches; changed moments receive another vector rather than changing old nodes. No node part escapes through public pose/instant outputs. Tensor/principal keys and physical reductions remain unchanged; no shooting target, raw pose or IK answer is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources For N queries and S fixed model parts, history owns at most 3N+6 numeric mass nodes, O(N*S), plus O(N) I/h/inverses, two boundary moments and one last tensor. Shared private moments cost 3S numeric fields; each node retains 8S+3 remaining fields, before map keys/object/array overhead whose heap bytes depend on runtime. clear empties every node/map/shared-moment list and unregisters instants; no raw bone map/full pose survives posing. Its caller separately releases the O(S) model.
 */
export function AirborneShapeHistory(
  model: resolveAutoMovieCenterOfMass.IModel | prepareAutoMovieMassModel.IPrepared,
  shape: (seconds: number) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  difference: number,
  span?: { from: number; to: number },
): ICachedHistory {
  const instants: Map<number, IInstant> = new Map();
  const poses: Map<number, resolveAutoMovieMomentum.IPosed> = new Map();
  const intrinsicMoments: (IAutoMovieVector3 | undefined)[] = [];
  const principal: IPrincipalOwner = { kind: "owner" };
  let previousTensor: IPrincipalTensor | undefined;
  const delta: number = span === undefined
    ? difference
    : Math.min(difference, (span.to - span.from) / 2);
  const stencil: {
    from: number;
    to: number;
    lower: number;
    upper: number;
  } | undefined = span === undefined ? undefined : {
    from: span.from,
    to: span.to,
    lower: span.from + delta,
    upper: span.to - delta,
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

  /** Only an exactly unchanged current tensor can lend its completed principal numbers. */
  const axes: (matrix: number[][]) => IInstant["inertia"] = (matrix: number[][]): IInstant["inertia"] => {
    const cached: IPrincipalTensor = previousTensor ??= {
      ready: false,
      matrix: [],
      value: { moments: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
    };
    let same: boolean = cached.ready;
    for (let row: number = 0; row < 3 && same; row++)
      for (let column: number = 0; column < 3; column++)
        if (!Object.is(cached.matrix[3 * row + column], matrix[row]![column])) {
          same = false;
          break;
        }
    if (same)
      return { moments: { ...cached.value.moments }, rotation: { ...cached.value.rotation } };

    // Jacobi mutates its rows. Copy the actual key first and invalidate the
    // old result until a complete solve has produced independent numbers.
    cached.ready = false;
    for (let row: number = 0; row < 3; row++)
      for (let column: number = 0; column < 3; column++)
        cached.matrix[3 * row + column] = matrix[row]![column]!;
    const value: IInstant["inertia"] = physicalPrincipalAxes(matrix);
    Object.assign(cached.value.moments, value.moments);
    Object.assign(cached.value.rotation, value.rotation);
    cached.ready = true;
    return value;
  };

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
    }
    poses.set(at, posed);
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
    const inertia: IInstant["inertia"] = axes(tensor(posed));
    if (stencil === undefined)
      return {
        inertia,
        relative: momentum(seconds - difference, seconds + difference),
      };
    const centre: number = Math.max(
      stencil.lower,
      Math.min(stencil.upper, seconds),
    );
    const a: number = Math.max(stencil.from, centre - delta);
    const b: number = Math.min(stencil.to, centre + delta);
    if (centre === seconds) return { inertia, relative: momentum(a, b) };
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
    return {
      inertia,
      relative: Vector3.add(
        boundary.central,
        Vector3.scale(boundary.change, (2 * (seconds - centre)) / (b - a)),
      ),
    };
  };
  const query: IHistory = (seconds: number): IInstant => {
    const known: IInstant | undefined = instants.get(seconds);
    if (known !== undefined) return known;
    const instant: IInstant = evaluate(seconds);
    PRINCIPAL.set(instant, principal);
    instants.set(seconds, instant);
    return instant;
  };
  return Object.assign(query, {
    clear: (): void => {
      for (const instant of instants.values()) PRINCIPAL.delete(instant);
      instants.clear();
      poses.clear();
      intrinsicMoments.length = 0;
      boundaries.clear();
      principal.previous = undefined;
      previousTensor = undefined;
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


