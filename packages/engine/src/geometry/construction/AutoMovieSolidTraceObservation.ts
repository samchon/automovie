import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

/**
 * Bounded observations of already executed trace guards, with no geometry queries.
 */
export namespace AutoMovieSolidTraceObservation {
  /** Closed identities of actual existing numerical/domain rejection guards.
   */
  export type Reason = "invalid-host-chart" | "host-jet-unavailable" |
    "host-crossing-budget" | "host-face-limit" | "host-open-boundary" | "host-receiver-unavailable" |
    "part-chart-outside" | "part-jet-unavailable" | "host-trial-unavailable" | "singular-newton-jacobian" |
    "residual-not-decreasing" | "line-search-stalled" | "newton-iterations" |
    "singular-first-rate" | "singular-second-rate" | "branch-distance" |
    "walk-step-failed" | "walk-step-limit" | "walk-no-progress" | "walk-part-bound" | "singular-tangent";

  /** Actual rejected native chart; trials have two host coordinates, solves four.
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
   */
  export interface IFailure extends IRejected, IData {
    /** Latest actually rejected trial in this attempt, not a claim that it caused every later failure. */
    lastRejectedTrial: IRejected | null;
  }

  /** One call-owned meeting attempt; successful data is borrowed until its caller returns.
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
   */
  export interface IDirection {
    /** Direction relative to the original seed tangent: forward plus one or reverse minus one. */
    sense: 1 | -1;
    /** Actual existing guard that rejected this attempt; never a guessed geometric cause. */
    reason: Reason;
    /** World chords already accumulated before this terminal first-walk state, mm. */
    length: number;
    /** Last accepted native meeting and its world point, distinct from the attempted prediction. */
    last: { chart: readonly number[]; point: AutoMovieVector3Tuple; face: number };
    /** Accepted source state before the last attempted chord, absent before any trial. */
    before: IDirection["last"] | null;
    /** Last attempted chord in mm and its actual prediction, or null when no step was attempted. */
    step: { h: number; predicted: AutoMovieVector3Tuple;
      tangent: AutoMovieVector3Tuple; guess: readonly number[]; halving: number;
      /** Actual world correction distance and guard allowance; null before a corrected point exists. */
      distance: number | null; allowance: number | null } | null;
    /** Actual terminal solver snapshot, or null when rejection occurred outside that solver. */
    solve: IFailure | null;
  }

  /**
   * Retain one actually rejected host trial and return its unchanged null.
   */
  export function reject(state: IState | undefined, reason: Reason,
    chart: readonly number[], face: number): null {
    if (state !== undefined) state.trial = { reason, chart: [...chart], face };
    return null;
  }
  /**
   * Borrow current already evaluated meeting data until a terminal guard detaches it.
   */
  export function hold(state: IState | undefined, gap: number, residual: readonly number[],
    part: IAutoMovieSolidSurface.IJet, host: IAutoMovieSolidSurface.IJet, budget: number): void {
    if (state !== undefined) state.meeting = { gap, residual, jacobian: null, part, host, budget };
  }
  /**
   * Detach the actual current failure and return the original null guard result.
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
