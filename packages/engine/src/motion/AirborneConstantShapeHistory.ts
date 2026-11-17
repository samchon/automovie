import type { AutoMovieHumanoidBone, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { indexSkeletonTopology } from "../kinematics/indexSkeletonTopology";
import { prepareAutoMovieMassModel } from "../kinematics/prepareAutoMovieMassModel";
import { resolveAutoMovieBoneRates } from "../kinematics/resolveAutoMovieBoneRates";
import type { resolveAutoMovieCenterOfMass } from "../kinematics/resolveAutoMovieCenterOfMass";
import { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { resolveAutoMovieMomentumRates } from "../kinematics/resolveAutoMovieMomentumRates";
import { physicalInertiaFactor } from "../physics/physicalInertiaFactor";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import { AirborneShapeInertia } from "./AirborneShapeInertia";
import { AirborneShapeStatistics } from "./AirborneShapeStatistics";
import type { integrateAirborneRotation } from "./integrateAirborneRotation";

/** The native reader owns only copied numeric physical input after construction. */
interface IConstant {
  /** One fixed root-frame tensor, never exposed or consumed by Jacobi. */
  matrix: number[][];
  /** Covered physical seconds, absent for a constant defined for all real time. */
  span?: { from: number; to: number };
  /** Clear permanently ends the closed-form capability of this epoch. */
  active: boolean;
  /** Fixed-size native event counters only, without a caller callback. */
  statistics?: AirborneShapeStatistics.IStatistics;
  /** Lazy positive-definite operator; null preserves ordinary invalid-inertia admission. */
  factor?: physicalInertiaFactor.IPrepared | null;
}

/** Only the numerical factory below can register constant-history construction. */
const CONSTANTS: WeakMap<integrateAirborneRotation.IHistory, IConstant> = new WeakMap();

/**
 * Construct a genuinely fixed root-frame shape from copied rig/bone values.
 *
 * Unlike a sampled shape callback, all coefficients are actual immutable
 * constructor data. The caller's actual full native FK supplies every ancestor
 * with its actual clinical axes/rest frames; explicit zero
 * local/root derivatives propagate through its existing rate owner and the
 * actual centroidal reducer. The resulting numeric tensor and zero relative
 * momentum alone enter the returned reader. Each query issues fresh mutable
 * data, so editing a previous result cannot change any future history value.
 * Clear ends this native observation/invariant epoch; the remaining reader
 * still issues the same fixed values without restarting that observation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States copied fixed root-frame inputs, SI rate propagation/reduction, covered seconds, undefined unavailable-rate fallback, fresh query records and permanent capability invalidation on clear. Namespace constant returns only the private positive operator for a fully covered live epoch; owned proves constructor provenance.
 * @evidence contracts/development/implementation.md#principled-implementation Fixed rig/pose coefficients have identically zero derivatives. Native FK differentiates those explicit declarations and the shared centroidal formula derives h before its exact-zero consistency check. Whole-curve constancy follows construction, not equal samples or a trusted callback flag.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Copy the actual fixed rig and full resolved bone snapshot without rebuilding it under different clinical tables, propagate complete bone rates, pose the same mass model, admit the tensor and reduce momentum, then transfer only numeric data to a separate reader factory outside model/FK scope.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No arbitrary callback obtains constancy, no missing derivative becomes zero and no actual moving curve is certified. The consumer must independently prove the snapshot describes its displayed articulation. Unsupported rate propagation returns undefined; physical reduction errors propagate without replacement or a tolerance change.
 * @evidence contracts/development/implementation.md#efficient-algorithms Construction is O(B+S) over B rig bones and S mass parts, with one full FK/rate propagation and one mass/tensor/momentum reduction. Query work and fixed-operator lookup are constant; every output is fresh and no mass node is rebuilt per timestamp. Runtime gains remain unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same constructor-owned numeric tensor defines every future query. Private weak membership only locates that proof; complete span coverage and the live epoch additionally gate a lazy factor. Earlier mutable outputs never feed the fixed input, while clear ends the capability without changing the fixed numeric reader's values.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Construction releases copied rig/pose, full bone/rate maps and posed parts after transferring the nine tensor numbers to a module-scope reader factory. The reader retains O(N) issued numeric instants until clear, then releases their private factor/statistics state and its lazy factor. No model, rig, pose, callbacks or derivative maps enter playback or the retained history.
 */
export function AirborneConstantShapeHistory(
  model: resolveAutoMovieCenterOfMass.IModel | prepareAutoMovieMassModel.IPrepared,
  skeleton: IAutoMovieSkeleton,
  source: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  span?: { from: number; to: number },
  observation?: AirborneShapeStatistics.IObserver,
): integrateAirborneRotation.ICachedHistory | undefined {
  if (span !== undefined && !(Number.isFinite(span.from) && Number.isFinite(span.to) && span.to > span.from))
    throw new Error("A constant airborne shape needs a finite increasing span");
  const statistics: AirborneShapeStatistics.IStatistics | undefined = AirborneShapeStatistics.borrow(observation);
  const rig: IAutoMovieSkeleton = structuredClone(skeleton);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const [name, bone] of source) bones.set(name, structuredClone(bone));
  const local: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
  for (const bone of bones.keys()) local.set(bone, { x: 0, y: 0, z: 0 });
  const rates: ReturnType<typeof resolveAutoMovieBoneRates> = resolveAutoMovieBoneRates(
    indexSkeletonTopology(rig), bones, local,
    { position: { x: 0, y: 0, z: 0 }, linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } },
  );
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
  const posed: resolveAutoMovieMomentum.IPosed = "segments" in model
    ? resolveAutoMovieMomentum.pose(model, bones) : prepareAutoMovieMassModel.pose(model, bones);
  if (statistics !== undefined) statistics.uniqueNumericNodes++;
  const matrix: number[][] = "segments" in model
    ? physicalInertiaTensor(posed.parts, posed.centre) : prepareAutoMovieMassModel.inertia(model, posed);
  let scale: number = Number.NEGATIVE_INFINITY;
  for (const row of matrix) for (const value of row) scale = Math.max(scale, Math.abs(value));
  if (!(scale > 0)) throw new Error("Invalid aggregate inertia tensor");
  const momentum: resolveAutoMovieMomentum.IMomentum = "segments" in model
    ? resolveAutoMovieMomentumRates(model, posed, bones, rates)
    : prepareAutoMovieMassModel.rates(model, posed, bones, rates);
  if (!(momentum.angular.x === 0 && momentum.angular.y === 0 && momentum.angular.z === 0)) return undefined;
  return numericHistory(matrix, span, statistics);
}

/** Numeric-only construction prevents the returned reader retaining any FK or mass input scope. */
function numericHistory(
  matrix: number[][],
  span: { from: number; to: number } | undefined,
  statistics: AirborneShapeStatistics.IStatistics | undefined,
): integrateAirborneRotation.ICachedHistory {
  const state: IConstant = { matrix, span: span === undefined ? undefined : { ...span }, active: true, statistics };
  const issued: Set<integrateAirborneRotation.IInstant> = new Set();
  const query: integrateAirborneRotation.IHistory = (_seconds: number): integrateAirborneRotation.IInstant => {
    if (state.statistics !== undefined) state.statistics.queries++;
    const instant: integrateAirborneRotation.IInstant = AirborneShapeInertia(matrix, { x: 0, y: 0, z: 0 }, state.statistics);
    issued.add(instant);
    return instant;
  };
  CONSTANTS.set(query, state);
  return Object.assign(query, { clear: (): void => {
    for (const instant of issued) AirborneShapeInertia.release(instant);
    issued.clear();
    state.factor = undefined;
    state.active = false;
    state.statistics = undefined;
  } });
}

/**
 * Private construction proof for fixed numeric physical histories.
 *
 * @evidence contracts/development/common.md#meaningful-documentation owned recognizes native readers; constant requires finite increasing requested seconds wholly covered by its live copied span and returns a borrowed immutable positive operator or undefined.
 * @evidence contracts/development/design.md#principled-representation The weak record represents a constructor-owned fixed tensor and identically zero relative momentum, separately from mutable per-query output records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AirborneShapeHistory delegates provenance and constant lookup; the invariant solver consumes only the existing physicalInertiaFactor operator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No public registration, caller flag, sampled equality or mutable result certifies the history. Snapshot ownership, covered span and live epoch establish the proof; copied callbacks/wrappers fail lookup.
 */
export namespace AirborneConstantShapeHistory {
  /** Native construction alone proves purity, without granting an invariant after clear. */
  export function owned(history: integrateAirborneRotation.IHistory): boolean { return CONSTANTS.has(history); }

  /** Borrow the fixed physical operator only during its live, completely covered epoch. */
  export function constant(history: integrateAirborneRotation.IHistory, from: number, to: number): physicalInertiaFactor.IPrepared | undefined {
    const state: IConstant | undefined = CONSTANTS.get(history);
    if (state === undefined || !state.active || !(Number.isFinite(from) && Number.isFinite(to) && to > from) ||
      (state.span !== undefined && (from < state.span.from || to > state.span.to))) return undefined;
    if (state.factor === undefined) {
      if (state.statistics !== undefined) state.statistics.factorizations++;
      state.factor = physicalInertiaFactor(state.matrix);
    }
    return state.factor ?? undefined;
  }
}
