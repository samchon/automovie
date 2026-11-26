import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMomentum,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { indexSkeletonTopology } from "../kinematics/indexSkeletonTopology";
import { prepareAutoMovieMassModel } from "../kinematics/prepareAutoMovieMassModel";
import { resolveAutoMovieBoneRates } from "../kinematics/resolveAutoMovieBoneRates";
import { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { resolveAutoMovieMomentumRates } from "../kinematics/internal/resolveAutoMovieMomentumRates";
import { physicalInertiaFactor } from "../physics/physicalInertiaFactor";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import { AirborneShapeInertia } from "./AirborneShapeInertia";
import { AirborneShapeStatistics } from "./AirborneShapeStatistics";
import type { integrateAirborneRotation } from "./integrateAirborneRotation";

/**
 * Construct a genuinely fixed root-frame shape from copied rig/bone values.
 *
 * Unlike a sampled shape callback, all coefficients are actual immutable
 * constructor data. The caller's actual full native FK supplies every ancestor
 * with its actual clinical axes/rest frames; explicit zero local/root
 * derivatives propagate through its existing rate owner and the actual
 * centroidal reducer. The resulting numeric tensor and zero relative momentum
 * alone enter the returned reader. Each query issues fresh mutable data, so
 * editing a previous result cannot change any future history value. Clear ends
 * this native observation/invariant epoch; the remaining reader still issues
 * the same fixed values without restarting that observation.
 */
export function AirborneConstantShapeHistory(
  model:
    | IAutoMovieResolveCenterOfMass.IModel
    | prepareAutoMovieMassModel.IPrepared,
  skeleton: IAutoMovieSkeleton,
  source: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  span?: { from: number; to: number },
  observation?: AirborneShapeStatistics.IObserver,
): integrateAirborneRotation.ICachedHistory | undefined {
  if (span !== undefined && !(span.to > span.from))
    throw new Error("A constant airborne shape needs a finite increasing span");
  const statistics: AirborneShapeStatistics.IStatistics | undefined =
    AirborneShapeStatistics.borrow(observation);
  const rig: IAutoMovieSkeleton = structuredClone(skeleton);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const [name, bone] of source) bones.set(name, structuredClone(bone));
  const local: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
  for (const bone of bones.keys()) local.set(bone, { x: 0, y: 0, z: 0 });
  const rates: ReturnType<typeof resolveAutoMovieBoneRates> =
    resolveAutoMovieBoneRates(indexSkeletonTopology(rig), bones, local, {
      position: { x: 0, y: 0, z: 0 },
      linear: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 0 },
    });
  if (rates === undefined) return undefined;

  // A map that lacks a mass-bearing bone proves no fixed shape: the rates
  // skip an absent subtree without refusing it, so completeness is read
  // here, before the mass model would throw for the bone it cannot pose.
  if ("segments" in model) {
    for (const segment of model.segments)
      if (!rates.has(segment.bone)) return undefined;
  } else
    for (const bone of prepareAutoMovieMassModel.bones(model))
      if (!rates.has(bone)) return undefined;
  const posed: resolveAutoMovieMomentum.IPosed =
    "segments" in model
      ? resolveAutoMovieMomentum.pose(model, bones)
      : prepareAutoMovieMassModel.pose(model, bones);
  if (statistics !== undefined) statistics.uniqueNumericNodes++;
  const matrix: number[][] =
    "segments" in model
      ? physicalInertiaTensor(posed.parts, posed.centre)
      : prepareAutoMovieMassModel.inertia(model, posed);
  let scale: number = Number.NEGATIVE_INFINITY;
  for (const row of matrix)
    for (const value of row) scale = Math.max(scale, Math.abs(value));
  if (!(scale > 0)) throw new Error("Invalid aggregate inertia tensor");
  const momentum: IAutoMovieBodyMomentum =
    "segments" in model
      ? resolveAutoMovieMomentumRates(model, posed, bones, rates)
      : prepareAutoMovieMassModel.rates(model, posed, bones, rates);
  if (
    !(
      momentum.angular.x === 0 &&
      momentum.angular.y === 0 &&
      momentum.angular.z === 0
    )
  )
    return undefined;
  return numericHistory(matrix, span, statistics);
}

/**
 * Numeric-only construction prevents the returned reader retaining any FK or
 * mass input scope.
 */
function numericHistory(
  matrix: number[][],
  span: { from: number; to: number } | undefined,
  statistics: AirborneShapeStatistics.IStatistics | undefined,
): integrateAirborneRotation.ICachedHistory {
  if (statistics !== undefined) statistics.factorizations++;
  const state: AirborneConstantShapeHistory.IConstant = {
    matrix,
    span: span === undefined ? undefined : { ...span },
    active: true,
    statistics,
    factor: physicalInertiaFactor(matrix),
  };
  const issued: Set<IAutoMovieIntegrateAirborneRotation.IInstant> = new Set();
  const query: IAutoMovieIntegrateAirborneRotation.IHistory = (
    _seconds: number,
  ): IAutoMovieIntegrateAirborneRotation.IInstant => {
    if (state.statistics !== undefined) state.statistics.queries++;
    const instant: IAutoMovieIntegrateAirborneRotation.IInstant =
      AirborneShapeInertia(matrix, { x: 0, y: 0, z: 0 }, state.statistics);
    issued.add(instant);
    return instant;
  };
  return Object.assign(query, {
    native: true as const,
    constantState: state,
    clear: (): void => {
      for (const instant of issued) AirborneShapeInertia.release(instant);
      issued.clear();
      state.factor = undefined;
      state.active = false;
      state.statistics = undefined;
    },
  });
}

/** Private construction proof for fixed numeric physical histories. */
export namespace AirborneConstantShapeHistory {
  /** The native reader owns only copied numeric physical input. */
  export interface IConstant {
    /** One fixed root-frame tensor, never exposed or consumed by Jacobi. */
    matrix: number[][];
    /** Covered physical seconds, absent for a constant defined for all time. */
    span?: { from: number; to: number };
    /** Clear permanently ends the closed-form capability of this epoch. */
    active: boolean;
    /** Fixed-size native event counters only, without a caller callback. */
    statistics?: AirborneShapeStatistics.IStatistics;
    /**
     * Positive-definite operator made with the history; null preserves ordinary
     * invalid-inertia admission.
     */
    factor: physicalInertiaFactor.IPrepared | null | undefined;
  }

  /** A constant history carries its fixed tensor state. */
  export interface IConstantHistory {
    /** Set by the factory; absent on any other reader. */
    readonly constantState?: IConstant;
  }

  /**
   * Native construction alone proves purity, without granting an invariant
   * after clear.
   */
  export function owned(
    history: IAutoMovieIntegrateAirborneRotation.IHistory & IConstantHistory,
  ): boolean {
    return history.constantState !== undefined;
  }

  /**
   * Borrow the fixed physical operator only during its live, completely covered
   * epoch.
   */
  export function constant(
    history: IAutoMovieIntegrateAirborneRotation.IHistory & IConstantHistory,
    from: number,
    to: number,
  ): physicalInertiaFactor.IPrepared | undefined {
    const state: IConstant | undefined = history.constantState;
    if (
      state === undefined ||
      !state.active ||
      !(to > from) ||
      (state.span !== undefined &&
        (from < state.span.from || to > state.span.to))
    )
      return undefined;
    return state.factor ?? undefined;
  }
}
