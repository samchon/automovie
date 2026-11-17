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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States root-frame shape, difference seconds, boundary correction and separate history/model ownership. Namespace inverse preserves the public principal path; factor lends the owned unobserved tensor operator and owned recognizes this factory's native pure history for operation-local stage reuse.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the existing physical tensor and principal-axis owners and the same two-pose rigid-body momentum formula; boundary correction retains the derivative of the quadratic interpolant with the unchanged difference interval.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Select the model's pose and interval reducers together, then share one exact numeric-node reader and momentum reducer across this history's entire operation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every first demanded exact shape node evaluates the actual pure shape; no interpolation, time quantization, reduced stencil or changed physical check replaces it. Only numeric mass parts and their centre survive that read. Private issued-instant provenance plus actual quaternion checks, never a public prepared flag, establish inverse reuse.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each query uses at most four distinct numeric nodes and O(S) mass work. Across N distinct I/h queries, at most 3N+6 exact nodes each perform shape/IK/FK once, including repeated endpoints separated by other queries/trials. A tensor-factor consumer omits Jacobi entirely; public principal materialization computes the existing eigensolve once per instant. Actual sums/stencils remain and runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact time under this unchanged pure shape/model/span fixes numeric mass parts and I/h, sharing any previous endpoint without an eviction distance. Private nodes share owned moment vectors after three Object.is matches and owned principal rotations after four; changes retain another vector without changing old nodes. Every pose producer returns a fresh principal quaternion before this private adoption. No node part escapes through public pose/instant outputs. Tensor/principal keys and physical reductions remain unchanged; no shooting target, raw pose or IK answer is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources For N queries and S fixed model parts, history owns at most 3N+6 numeric mass nodes, O(N*S), plus O(N) instants with nine tensor scalars, optional fixed-size factors/principal data/inverses and two boundary moments. Shared private moments cost 3S numeric fields; each node retains at most 8S+3 remaining fields, with exact unchanged principal frames sharing four of them. The two O(S) last-value lists add references only; map/object/array overhead depends on runtime. clear empties every numeric map/list and unregisters instants; no raw bone map/full pose survives posing. Its caller separately releases the O(S) model.
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
      return AirborneShapeInertia(matrix, momentum(seconds - difference, seconds + difference));
    const centre: number = Math.max(
      stencil.lower,
      Math.min(stencil.upper, seconds),
    );
    const a: number = Math.max(stencil.from, centre - delta);
    const b: number = Math.min(stencil.to, centre + delta);
    if (centre === seconds) return AirborneShapeInertia(matrix, momentum(a, b));
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
    );
  };
  const query: IHistory = (seconds: number): IInstant => {
    const known: IInstant | undefined = instants.get(seconds);
    if (known !== undefined) return known;
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
   * @evidence contracts/development/common.md#meaningful-documentation States unobserved issued-tensor eligibility, undefined fallback and borrowed independent-output operator ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates private tensor authority and positive Cholesky admission to AirborneShapeInertia; the factor solves and reconstructs the same physical root-frame tensor without eigenvectors.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This history owner exposes its numerical capability through one delegated lookup for ODE, dense defect and takeoff consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Identity alone cannot certify reuse: the actual private unobserved accessor must remain intact. Public reads and assignments permanently restore mutable principal authority for the instant.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant lookup and descriptor comparisons with at most one fixed-size Cholesky factor per eligible instant; no Jacobi or matrix allocation on repeated RHS/tangent reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One exact instant owns one unchanged tensor and factor across all momentum trials; current world attitude, relative momentum and right-hand sides remain evaluated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The history clears the private registration with each instant and owns no extra factor population outside its O(N) numeric memo.
   */
  export function factor(instant: IInstant): physicalInertiaFactor.IPrepared | undefined {
    return AirborneShapeInertia.factor(instant);
  }

  /**
   * Recognize this factory's native pure-history reader for operation-local
   * stage sharing. It proves construction, not smoothness or constant shape.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States native-reader provenance and explicitly excludes smoothness or invariant-shape claims.
   * @evidence contracts/development/implementation.md#principled-implementation Factory histories already reduce pure shape values into an exact numeric epoch; the takeoff solver may share its own stage partition while retaining each trial's complete error checks.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak-set membership query distinguishes the actual native reader from raw callbacks or copied wrappers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No public prepared flag, sampled equality or foreign callback identity certifies factory construction; the private set has no external writer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-time weak membership without inspecting a body, pose, time population or source graph.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Clear forgets numeric nodes but leaves this same pure reader's contract intact; an unrelated callback or wrapper does not inherit provenance.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak membership retains neither history callbacks nor their shape/model owners after callers release them; solver-owned partitions remain separately scoped and released.
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


