/**
 * Detached evidence from the existing bounded seed search, in chart mm/radians.
 * Null gap/chart means the actual branch had no finite reading, never zero. A
 * null candidate-completion iteration means not applicable; meet-end owns the
 * actual accepted Newton update count for that local solve.
 */
export namespace IAutoMovieConstructionSeedTrace {
  /**
   * Existing Newton termination, or candidate admission, without global
   * absence.
   */
  export type Reason =
    | "start"
    | "accepted-step"
    | "converged"
    | "nonfinite-start"
    | "unavailable-jet"
    | "nonfinite-gap"
    | "singular-step"
    | "nonfinite-step"
    | "armijo-exhausted"
    | "updates-exhausted"
    | "outside-admission"
    | "candidate-failed";

  /** One actual candidate/iteration/termination state. */
  export interface IEvent {
    /** The existing branch. */
    kind: "candidate" | "iteration" | "meet-end";
    /** Fixed part phase, radians. */
    phase: number | null;
    /** Initial part station, mm. */
    start: number | null;
    /** Current [part station mm, host station mm, host phase radians]. */
    chart: [number, number, number] | null;
    /** Actual physical residual norm in mm, or no finite reading. */
    gap: number | null;
    /**
     * Accepted Newton updates; null on candidate completion, whose count
     * belongs to meet-end.
     */
    iteration: number | null;
    /** Actual branch or termination reason. */
    reason: Reason;
    /** How the existing foot initialization chose the host chart. */
    initial?: "warm-foot" | "cold-foot" | "coarse";
  }

  /** A synchronous nonthrowing value observer. */
  export type Sink = (event: IEvent) => void;
}
