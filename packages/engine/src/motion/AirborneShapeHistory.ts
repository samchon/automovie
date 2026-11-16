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

/** One boundary stencil needs the query, its shifted centre and its two ends. */
const STENCIL_NODES: number = 4;

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
 * correction at either boundary. An optional prepared model is borrowed;
 * its caller releases it after clearing this history, including on refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States root-frame shape, difference seconds, boundary correction and separate history/model ownership. Namespace inverse reads only factory-issued instants, returns undefined for a general history output, validates copied principal coordinates and lends an immutable root-to-principal value to the ODE/dense consumers.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the existing physical tensor and principal-axis owners and the same two-pose rigid-body momentum formula; boundary correction retains the derivative of the quadratic interpolant with the unchanged difference interval.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Select the model's pose and interval reducers together, then share one bounded exact-node reader and momentum reducer across numeric history queries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every new exact time reads the actual pure shape; no interpolation, time quantization, reduced stencil or changed physical check replaces evaluation. A private issued-instant registration alone proves only provenance: inverse additionally checks all four actual quaternion coordinates, never trusting a public prepared flag.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each new query needs at most four posed nodes and O(S) mass work; an exact hit in the four-node numeric LRU also omits its repeated shape/IK/FK read. One boundary stencil's maximum footprint supplies the cache bound, without a numerical sampling policy. Prepared models share unchanged scalar transforms and shape suppliers may request only mass-bearing FK.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact time under one unchanged shape/model/span identifies I/h across trials; four recent numeric posed nodes share stencil overlap and fixed boundaries share momenta. Issued instant identity selects private inverse provenance, then Object.is checks copied principal coordinates including mutation/signed zero; unchanged adjacent rotations may share the owner's last inverse. Evictions compute normally, and the token selects both model reducers without unrelated pairing.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The history owns O(N) numeric I/h instants and weak inverse registrations, at most two boundary moments and four posed mass reductions of O(S) numeric parts. clear unregisters N instants, clears all three maps and forgets the last inverse. Raw bone maps and full canonical poses never enter the retained node cache. A borrowed model separately owns O(S) scalar state released by the planning caller.
 */
export function AirborneShapeHistory(
  model: resolveAutoMovieCenterOfMass.IModel | prepareAutoMovieMassModel.IPrepared,
  shape: (seconds: number) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  difference: number,
  span?: { from: number; to: number },
): ICachedHistory {
  const instants: Map<number, IInstant> = new Map();
  const poses: Map<number, resolveAutoMovieMomentum.IPosed> = new Map();
  const principal: IPrincipalOwner = { kind: "owner" };
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

  // Only the two boundary stencils recur at different query times.
  // Their numeric moments are sufficient; their bones need not survive.
  const boundaries: Map<
    number,
    { central: IAutoMovieVector3; change: IAutoMovieVector3 }
  > = new Map();

  // Keep only one stencil's sufficient numeric footprint. A shared exact
  // endpoint needs neither another displayed solve nor another FK, while
  // every new or evicted time still reads its actual shape.
  const read: (at: number) => resolveAutoMovieMomentum.IPosed = (
    at: number,
  ): resolveAutoMovieMomentum.IPosed => {
    const known: resolveAutoMovieMomentum.IPosed | undefined = poses.get(at);
    if (known !== undefined) {
      poses.delete(at);
      poses.set(at, known);
      return known;
    }
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = shape(at);
    const posed: resolveAutoMovieMomentum.IPosed = pose(bones);
    if (poses.size === STENCIL_NODES) poses.delete(poses.keys().next().value!);
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
    const inertia: IInstant["inertia"] = physicalPrincipalAxes(tensor(posed));
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


