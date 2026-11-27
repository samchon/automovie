import { AutoMovieEngineKinematics } from "../../../kinematics/AutoMovieEngineKinematics";
import type { AutoMovieHumanoidBone, IAutoMovieBodyMomentum, IAutoMovieIntegrateAirborneRotation, IAutoMovieQuaternion, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";


import type { AutoMovieEngineKinematicsTypes } from "../../../kinematics/AutoMovieEngineKinematicsTypes";

import { resolveAutoMovieMomentumRates } from "../../../kinematics/internal/resolveAutoMovieMomentumRates";
import { Quaternion } from "../../../math/Quaternion";
import { Vector3 } from "../../../math/Vector3";
import type { physicalInertiaFactor } from "../../../physics/internal/physicalInertiaFactor";
import { AirborneConstantShapeHistory } from "./AirborneConstantShapeHistory";
import { AirborneShapeInertia } from "./AirborneShapeInertia";
import { AirborneShapeReduction } from "./AirborneShapeReduction";
import { AirborneShapeStatistics } from "./AirborneShapeStatistics";
import { AirborneTabulatedShapeHistory } from "./AirborneTabulatedShapeHistory";
import type { AutoMovieEngineMotionAirborneRotation } from "../../AutoMovieEngineMotionAirborneRotation";

/*
 * Reduce pure root-frame shapes to exact-time inertia and relative momentum.
 *
 * Difference is the existing central half-interval in seconds. A span moves its
 * stencil inside the flight and preserves the quadratic one-sided correction at
 * either boundary. The model and pure shape stay unchanged throughout the reuse
 * epoch. An optional prepared model is borrowed; its caller releases it after
 * clearing this history, including on refusal. An optional native observer
 * records cumulative owner-event populations; omitted, no counter record or
 * per-query instrumentation value is allocated. An explicit instantaneous-rate
 * producer receives these same current bones; complete mass-bearing rates use
 * the shared centroidal reducer, while an unavailable or incomplete declaration
 * preserves the original stencil. Every rated node assesses derivatives during
 * its first actual shape read, including stencil neighbors, and retains only
 * the numeric result or its unavailability. Later query order cannot change its
 * derivative path.
 */
export function AirborneShapeHistory(
  model:
    | IAutoMovieResolveCenterOfMass.IModel
    | AutoMovieEngineKinematics.IPreparedMassModel,
  shape: (
    seconds: number,
  ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  difference: number,
  span?: { from: number; to: number },
  observation?: AirborneShapeStatistics.IObserver,
  analytic?: AirborneShapeHistory.IRates,
): ICachedHistory {
  const statistics: AirborneShapeStatistics.IStatistics | undefined =
    AirborneShapeStatistics.borrow(observation);
  const instants: Map<number, IInstant> = new Map();
  const poses: Map<number, INode> = new Map();
  const intrinsicMoments: (IAutoMovieVector3 | undefined)[] = [];
  const principalRotations: (IAutoMovieQuaternion | undefined)[] = [];
  const limits: typeof span =
    span === undefined ? undefined : { to: span.to, from: span.from };
  const delta: number =
    limits === undefined
      ? difference
      : Math.min(difference, (limits.to - limits.from) / 2);
  const stencil:
    | {
        from: number;
        to: number;
        lower: number;
        upper: number;
      }
    | undefined =
    limits === undefined
      ? undefined
      : {
          from: limits.from,
          to: limits.to,
          lower: limits.from + delta,
          upper: limits.to - delta,
        };
  // The mass snapshot and its reductions are selected together
  // (`AirborneShapeReduction`), which also refuses a released token here;
  // its admission keeps the original zero/NaN refusal before rate or
  // stencil callbacks.
  const {
    pose,
    between: interval,
    tensor,
    admit,
  }: AirborneShapeReduction.IReduction = AirborneShapeReduction(model);
  const required: ReadonlySet<AutoMovieHumanoidBone> | undefined =
    analytic === undefined
      ? undefined
      : "segments" in model
        ? new Set(
            model.segments.map(
              (
                segment: IAutoMovieResolveCenterOfMass.ISegment,
              ): AutoMovieHumanoidBone => segment.bone,
            ),
          )
        : AutoMovieEngineKinematics.prepareAutoMovieMassModelBones(model);

  // Only the two boundary stencils recur at different query times.
  // Their numeric moments are sufficient; their bones need not survive.
  const boundaries: Map<
    number,
    { central: IAutoMovieVector3; change: IAutoMovieVector3 }
  > = new Map();

  // A pure shape's sufficient numeric node belongs to this entire history,
  // including endpoints revisited after other stages or shooting trials.
  // Raw bones and canonical poses do not enter this operation-owned map.
  const read: (at: number) => INode = (at: number): INode => {
    const known: INode | undefined = poses.get(at);
    if (known !== undefined) return known;
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      shape(at);
    const posed: AutoMovieEngineKinematics.IPosedBody = pose(bones);

    // Nodes never escape this history. Their fixed moments can share a
    // private numeric copy, while public pose outputs keep their isolation.
    intrinsicMoments.length = posed.parts.length;
    principalRotations.length = posed.parts.length;
    for (let i: number = 0; i < posed.parts.length; i++) {
      const part: AutoMovieEngineKinematics.IPosedBody["parts"][number] =
        posed.parts[i]!;
      let fixed: IAutoMovieVector3 | undefined = intrinsicMoments[i];
      if (
        fixed === undefined ||
        !Object.is(fixed.x, part.inertia.x) ||
        !Object.is(fixed.y, part.inertia.y) ||
        !Object.is(fixed.z, part.inertia.z)
      ) {
        fixed = { x: part.inertia.x, y: part.inertia.y, z: part.inertia.z };
        intrinsicMoments[i] = fixed;
      }
      part.inertia = fixed;

      // Both actual pose producers create a fresh principal quaternion. It
      // can share an equal private predecessor without retaining raw bones.
      const rotation: IAutoMovieQuaternion | undefined = principalRotations[i];
      if (
        rotation !== undefined &&
        sameRotation(rotation, part.inertiaRotation)
      )
        part.inertiaRotation = rotation;
      else principalRotations[i] = part.inertiaRotation;
    }
    const node: INode = posed;
    if (analytic !== undefined) {
      const matrix: number[][] = tensor(posed);
      admit(matrix);
      if (statistics !== undefined) statistics.analyticAttempts++;
      const rates: ReturnType<AirborneShapeHistory.IRates> = analytic(
        at,
        bones,
      );
      let complete: boolean = rates !== undefined;
      if (rates !== undefined && required !== undefined)
        for (const bone of required)
          if (!rates.has(bone)) {
            complete = false;
            break;
          }
      const instantaneous: IAutoMovieBodyMomentum | undefined =
        rates === undefined || !complete
          ? undefined
          : "segments" in model
            ? resolveAutoMovieMomentumRates(model, posed, bones, rates)
            : AutoMovieEngineKinematics.prepareAutoMovieMassModelRates(model, posed, bones, rates);
      node.rated = { matrix, relative: instantaneous?.angular };
    }
    poses.set(at, node);
    if (statistics !== undefined) statistics.uniqueNumericNodes++;
    return node;
  };
  const momentum: (from: number, to: number) => IAutoMovieVector3 = (
    from: number,
    to: number,
  ): IAutoMovieVector3 => {
    const before: AutoMovieEngineKinematics.IPosedBody = read(from);
    const after: AutoMovieEngineKinematics.IPosedBody = read(to);
    return interval(before, after, to - from).angular;
  };
  const evaluate: (seconds: number) => IInstant = (
    seconds: number,
  ): IInstant => {
    const node: INode = read(seconds);
    const matrix: number[][] = node.rated?.matrix ?? tensor(node);
    if (node.rated === undefined) admit(matrix);
    if (node.rated !== undefined) {
      if (node.rated.relative !== undefined) {
        const instant: IInstant = AirborneShapeInertia(
          matrix,
          node.rated.relative,
          statistics,
        );
        if (statistics !== undefined) statistics.analyticAccepted++;
        return instant;
      }
      if (statistics !== undefined) statistics.analyticFallbacks++;
    }
    if (stencil === undefined)
      return AirborneShapeInertia(
        matrix,
        momentum(seconds - difference, seconds + difference),
        statistics,
      );
    const centre: number = Math.max(
      stencil.lower,
      Math.min(stencil.upper, seconds),
    );
    const a: number = Math.max(stencil.from, centre - delta);
    const b: number = Math.min(stencil.to, centre + delta);
    if (centre === seconds)
      return AirborneShapeInertia(matrix, momentum(a, b), statistics);
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
    return AirborneShapeInertia(
      matrix,
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
    instants.set(seconds, instant);
    return instant;
  };
  return Object.assign(query, {
    native: true as const,
    clear: (): void => {
      for (const instant of instants.values())
        AirborneShapeInertia.release(instant);
      instants.clear();
      poses.clear();
      intrinsicMoments.length = 0;
      principalRotations.length = 0;
      boundaries.clear();
    },
  });
}

/*
 * Exact numeric prerequisites private to instants produced by this owner.
 */
export namespace AirborneShapeHistory {
  /*
   * Actual simultaneous common-frame bone-origin metres/second and angular
   * radians/second, derived for these exact current bones. Undefined or missing
   * mass-bearing rates retain the original stencil; supplied invalid numbers
   * retain physical admission failure. No whole-curve invariant or derivative
   * truth is inferred from callback identity.
   */
  export type IRates = (
    seconds: number,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ) =>
    | ReadonlyMap<AutoMovieHumanoidBone, AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsBoneRate>
    | undefined;

  /*
   * Borrow the issued instant's tensor factor before public principal access.
   * Undefined preserves the principal path for foreign, observed, replaced or
   * non-SPD instants. Returned operators expose no mutable numerical storage.
   */
  export function factor(
    instant: IInstant & AirborneShapeInertia.IOwned,
  ): physicalInertiaFactor.IPrepared | undefined {
    return AirborneShapeInertia.factor(instant);
  }

  /*
   * A native pure-history reader carries this mark.
   */
  export interface INative {
    /*
     * Set by the factories of the pure histories.
     */
    readonly native?: true;
  }

  /*
   * Recognize this factory's native pure-history reader for operation-local
   * stage sharing. It proves construction, not smoothness or constant shape.
   */
  export function owned(history: IHistory & INative): boolean {
    return (
      history.native === true ||
      AirborneConstantShapeHistory.owned(history) ||
      AirborneTabulatedShapeHistory.owned(history)
    );
  }

  /*
   * Constructor-owned fixed tensor with zero relative momentum over the whole
   * requested live span; ordinary sampled histories return undefined.
   */
  export function constant(
    history: IHistory & AirborneConstantShapeHistory.IConstantHistory,
    from: number,
    to: number,
  ): physicalInertiaFactor.IPrepared | undefined {
    return AirborneConstantShapeHistory.constant(history, from, to);
  }

  /*
   * Read an issued instant's root-to-principal rotation, or leave a general
   * history output to its existing computation. The returned internal value is
   * borrowed and must not be mutated; its actual coordinates are checked
   * against the copied key on every read.
   *
   * States frames, unissued-output absence, copied coordinate validation and
   * borrowed immutable result ownership. Uses the existing Quaternion.inverse
   * on the same principal rotation; this inverse is shape-only and is
   * independent of the ODE's momentum, attitude and tangent directions. A
   * private issued-instant registration lends its history's fixed-size
   * last-value owner until the inverse is actually demanded; unissued outputs
   * return undefined for the caller's original fallback. Instant identity
   * establishes only private provenance; every copied quaternion coordinate
   * must additionally match the actual requested principal rotation before
   * reusing numeric work. One weak lookup and four scalar comparisons per read,
   * with one inverse for a new rotation. New instants initially share their
   * owner without per-instant state allocation; unchanged rotations share one
   * computed numeric record. The history's existing exact-time I/h memo already
   * selects the same issued instant across trials. Copied quaternion checks
   * also detect mutation and signed zero; adjacent exact rotations share the
   * owner's last inverse independently of momentum and target. Only the
   * history's N issued numeric instants have weak registrations. clear deletes
   * each registration and forgets the one last record in O(N), and dropping the
   * history also releases its weak keys. No callback, body, model or posed
   * history is retained by this numeric registry.
   */
  export function inverse(instant: IInstant): IAutoMovieQuaternion | undefined {
    return Quaternion.inverse(instant.inertia.rotation);
  }
}

/*
 * Component identity preserves signed zeros and observes edits to mutable
 * instant records.
 */
function sameRotation(
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): boolean {
  return (
    Object.is(a.x, b.x) &&
    Object.is(a.y, b.y) &&
    Object.is(a.z, b.z) &&
    Object.is(a.w, b.w)
  );
}

/*
 * The numeric sufficient statistics that survive a shape query.
 */
type IInstant = IAutoMovieIntegrateAirborneRotation.IInstant;

/*
 * The public query signature, shared without a second state model.
 */
type IHistory = IAutoMovieIntegrateAirborneRotation.IHistory;

/*
 * The memo's explicit owner can clear it after planning.
 */
type ICachedHistory = AutoMovieEngineMotionAirborneRotation.ICachedHistory;

/*
 * A private exact-time mass node retains only numeric physical sufficient data.
 */
interface INode extends AutoMovieEngineKinematics.IPosedBody {
  /*
   * Rated nodes admit their tensor before evaluating the current rate producer.
   */
  rated?: {
    /*
     * The same actual posed node's aggregate root-frame tensor.
     */
    matrix: number[][];

    /*
     * A complete valid derivative reduction, or explicit unavailable stencil
     * selection.
     */
    relative: IAutoMovieVector3 | undefined;
  };
}
