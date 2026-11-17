import type { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Bounded observations of already executed trace guards, with no geometry queries.
 *
 * @evidence contracts/development/design.md#principled-representation Closed rejection reasons and explicit nullable unavailable data distinguish actual solver/trial observations from the accepted walk point, in original mm/radian charts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The arc walk, its meeting solver and host trial are the runtime consumers. One attempt retains one rejected trial, one failure and borrowed final meeting data; the walk keeps at most two terminal direction snapshots.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No solver option, recovery policy, surface callback, global collector or trajectory is introduced. Existing jet/vector types are reused and absent observations are null, never fabricated derivatives.
 * @evidence contracts/development/common.md#meaningful-documentation States actual-data ownership, bounded retention, source units, nullable availability and the absence of any evaluator or numerical acceptance rule.
 */
export namespace AutoMovieSolidTraceObservation {
  /** Closed identities of actual existing numerical/domain rejection guards.
   * @evidence contracts/development/design.md#principled-representation The finite union names only existing trial, Newton, rate and walk refusals; it adds no acceptance state or recovery setting.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.
   * @evidence contracts/development/common.md#meaningful-documentation States native chart/face meaning, actual observation ownership and unavailable-data limits.
   */
  export type Reason = "invalid-host-chart" | "host-jet-unavailable" |
    "host-crossing-budget" | "host-face-limit" | "host-open-boundary" | "host-receiver-unavailable" |
    "part-jet-unavailable" | "host-trial-unavailable" | "singular-newton-jacobian" |
    "residual-not-decreasing" | "line-search-stalled" | "newton-iterations" |
    "singular-first-rate" | "singular-second-rate" | "branch-distance" |
    "walk-step-failed" | "walk-step-limit" | "singular-tangent";

  /** Actual rejected native chart; trials have two host coordinates, solves four.
   * @evidence contracts/development/design.md#principled-representation A rejection pairs its real face index with either the two host coordinates or the four part/host native coordinates, in mm/radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.
   * @evidence contracts/development/common.md#meaningful-documentation States native chart/face meaning, actual observation ownership and unavailable-data limits.
   */
  export interface IRejected {
    /** Actual existing guard that rejected this attempt; never a guessed geometric cause. */
    reason: Reason;
    /** Native rejected coordinates: host [u,v] or solve [s,phi,y,theta], in their original mm/radian units. */
    chart: readonly number[];
    /** Actual host-atlas face index used by the rejected attempt. */
    face: number;
  }

  /** Data already available at a guard; null explicitly means not observed there.
   * @evidence contracts/development/design.md#principled-representation Actual residual/Jacobian/jet/budget values remain distinct from explicit unavailable nulls; original source jet types are reused.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.
   * @evidence contracts/development/common.md#meaningful-documentation States native chart/face meaning, actual observation ownership and unavailable-data limits.
   */
  export interface IData {
    /** Already evaluated unscaled combined meeting/law residual norm, or null if not evaluated. */
    gap: number | null;
    /** Three world meeting residuals followed by the original unscaled law residual, or null. */
    residual: readonly number[] | null;
    /** Actual four-by-four matrix used by a solve; null when this guard did not obtain one. */
    jacobian: readonly (readonly number[])[] | null;
    /** Actual already-read part physical2 in its native chart, or explicitly unavailable null. */
    part: IAutoMovieSolidSurface.IJet | null;
    /** Actual already-read host physical2 in its native chart, or explicitly unavailable null. */
    host: IAutoMovieSolidSurface.IJet | null;
    /** Remaining actual shared host-crossing budget at this guard, or null if not read here. */
    budget: number | null;
  }

  /** One detached terminal failure and its last actual rejected trial, if any.
   * @evidence contracts/development/design.md#principled-representation A terminal reason and complete available snapshot retain at most one actual rejected trial, without a recursive failure history.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.
   * @evidence contracts/development/common.md#meaningful-documentation States native chart/face meaning, actual observation ownership and unavailable-data limits.
   */
  export interface IFailure extends IRejected, IData {
    /** Latest actually rejected trial in this attempt, not a claim that it caused every later failure. */
    lastRejectedTrial: IRejected | null;
  }

  /** One call-owned meeting attempt; successful data is borrowed until its caller returns.
   * @evidence contracts/development/design.md#principled-representation One mutable call-local collector separates its latest actual trial, terminal failure and borrowed successful meeting; dropping the call releases them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.
   * @evidence contracts/development/common.md#meaningful-documentation States native chart/face meaning, actual observation ownership and unavailable-data limits.
   */
  export interface IState {
    /** Latest detached terminal failure for this one meeting attempt; initially null. */
    failure: IFailure | null;
    /** Latest actually rejected trial, cleared when the next host trial begins. */
    trial: IRejected | null;
    /** Borrowed data from the current successful meeting until the caller returns or snapshots a failure. */
    meeting: IData | null;
    /** Current actual step values, absent until the walk evaluates a prediction. */
    step: IDirection["step"];
  }

  /** One failed direction, separate accepted and attempted states in native coordinates.
   * @evidence contracts/development/design.md#principled-representation Sense, accepted chart/point, attempted chord/prediction and actual solver failure are separate records; absent attempts and unavailable solver data are null.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.
   * @evidence contracts/development/common.md#meaningful-documentation States native chart/face meaning, actual observation ownership and unavailable-data limits.
   */
  export interface IDirection {
    /** Direction relative to the original seed tangent: forward plus one or reverse minus one. */
    sense: 1 | -1;
    /** Actual existing guard that rejected this attempt; never a guessed geometric cause. */
    reason: Reason;
    /** World chords already accumulated before this terminal first-walk state, mm. */
    length: number;
    /** Last accepted native meeting and its world point, distinct from the attempted prediction. */
    last: { chart: readonly number[]; point: AutoMovieSolidVector.Vec3; face: number };
    /** Last attempted chord in mm and its actual prediction, or null when no step was attempted. */
    step: { h: number; predicted: AutoMovieSolidVector.Vec3;
      tangent: AutoMovieSolidVector.Vec3; guess: readonly number[]; halving: number;
      /** Actual world correction distance and guard allowance; null before a corrected point exists. */
      distance: number | null; allowance: number | null } | null;
    /** Actual terminal solver snapshot, or null when rejection occurred outside that solver. */
    solve: IFailure | null;
  }

  /**
   * Retain one actually rejected host trial and return its unchanged null.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies only the supplied native chart and actual guard identity; does not query a domain, jet or neighbour.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The trial owner supplies the reason at its existing rejection, before the solver aggregates it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No failed trial becomes accepted and no exception is caught or replaced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size chart copying and one overwritten record; no growing event list.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A synchronous single rejection coordinates no requests or effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the caller's attempt retains this latest record; no module collector or source reference exists.
   * @evidence contracts/development/common.md#meaningful-documentation Names native coordinates, actual rejection ownership and unchanged null result.
   */
  export function reject(state: IState | undefined, reason: Reason,
    chart: readonly number[], face: number): null {
    if (state !== undefined) state.trial = { reason, chart: [...chart], face };
    return null;
  }
  /**
   * Borrow current already evaluated meeting data until a terminal guard detaches it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Stores only actual existing residual, jets and remaining budget. The owning solver later assigns its already computed Jacobian; this operation evaluates no geometry or numeric predicate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bounded record keeps terminal failure copying separate from unchanged Newton decisions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No stored observation is read to choose a candidate, tolerance, budget or recovery.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant record replacement with borrowed fixed-size data; no trajectory or matrix recomputation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A current synchronous reading coordinates no requests or effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One caller-owned current record is overwritten at the next actual accepted reading and released with its attempt.
   * @evidence contracts/development/common.md#meaningful-documentation States borrowed actual data, raw residual meaning and null Jacobian before the solver computes it.
   */
  export function hold(state: IState | undefined, gap: number, residual: readonly number[],
    part: IAutoMovieSolidSurface.IJet, host: IAutoMovieSolidSurface.IJet, budget: number): void {
    if (state !== undefined) state.meeting = { gap, residual, jacobian: null, part, host, budget };
  }
  /**
   * Detach the actual current failure and return the original null guard result.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies only supplied chart, residual, matrix and already read jet vectors; no mathematical quantity, query or failure classification is recomputed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner supplies the same bounded snapshot rule to solver and trial callers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Null fields retain unavailable observations and the returned null cannot recover or change the rejected result. No callback or exception handler is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant bounded copies of at most two six-vector jets and one four-by-four matrix; no trajectory scan or growing collection.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One synchronous terminal observation coordinates no requests or effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the supplied call-owned state retains one detached failure, overwritten by a later terminal failure; no module state persists.
   * @evidence contracts/development/common.md#meaningful-documentation Records original chart units, absent fields, borrowed input versus detached output and unchanged null result.
   */
  export function fail(state: IState | undefined, reason: Reason,
    chart: readonly number[], face: number, data: Partial<IData> = {}): null {
    if (state !== undefined) {
      const info: Partial<IData> = { ...state.meeting, ...data };
      state.failure = { reason, chart: [...chart], face,
        gap: info.gap ?? null, residual: info.residual === undefined || info.residual === null ? null : [...info.residual],
        jacobian: info.jacobian === undefined || info.jacobian === null ? null : info.jacobian.map((row: readonly number[]): number[] => [...row]),
        part: jet(info.part ?? null), host: jet(info.host ?? null), budget: info.budget ?? null,
        lastRejectedTrial: state.trial === null ? null : { ...state.trial, chart: [...state.trial.chart] },
      };
    }
    return null;
  }

  /**
   * Add bounded direction evidence after the original failure text.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Serializes only terminal direction snapshots. Nonfinite stored numbers become explicit strings instead of JSON null masquerading as finite data.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One suffix preserves the original readable diagnostic prefix and carries structured observation data.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not run a solver, query a surface, replace a geometry result or suppress an error.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work and output are linear in the supplied bounded terminal snapshots, at most two from the arc walk.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure serialization coordinates no requests or effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one string and retains neither the snapshots nor any source afterward.
   * @evidence contracts/development/common.md#meaningful-documentation States preserved prefix, normalized data scope and explicit nonfinite representation.
   */
  export function format(detail: string, directions: readonly IDirection[]): string {
    return detail + " | walkFailure=" + JSON.stringify({ stage: "length-walk", directions },
      (_key: string, value: unknown): unknown => typeof value === "number" && !Number.isFinite(value) ? String(value) : value);
  }
}

/** Copy actual already-read vectors so reverse continuation cannot mutate the failure record. */
function jet(value: IAutoMovieSolidSurface.IJet | null): IAutoMovieSolidSurface.IJet | null {
  return value === null ? null : { p: [...value.p], u: [...value.u], v: [...value.v],
    uu: [...value.uu], uv: [...value.uv], vv: [...value.vv] };
}
