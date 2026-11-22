/**
 * Detached evidence from the existing bounded seed search, in chart mm/radians.
 * Null gap/chart means the actual branch had no finite reading, never zero.
 * A null candidate-completion iteration means not applicable; meet-end owns
 * the actual accepted Newton update count for that local solve.
 *
 * @evidence contracts/development/design.md#principled-representation Existing candidate, Newton and admission branches publish their actual finite state and termination reason.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One optional nonthrowing observer receives values without changing candidate order or solve policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No trace event supplies a substitute meeting or repeats a solver.
 * @evidence contracts/development/common.md#meaningful-documentation States parameter units, null meaning and observer ownership.
 */
export namespace IAutoMovieConstructionSeedTrace {
  /**
   * Existing Newton termination, or candidate admission, without global absence.
   * @evidence contracts/development/design.md#principled-representation Distinguishes actual branch causes including null linear solves and nonfinite step vectors.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A closed vocabulary for the existing bounded search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains no claim that bounded failure proves no crossing.
   * @evidence contracts/development/common.md#meaningful-documentation Names the original termination and admission branches.
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

  /**
   * One actual candidate/iteration/termination state.
   * @evidence contracts/development/design.md#principled-representation Associates the actual phase/start with finite chart/gap state and its real branch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Does not retain a surface, candidate solver or callback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Null means unavailable rather than a fabricated zero measurement.
   * @evidence contracts/development/common.md#meaningful-documentation Fields state mm/radian units and accepted-update counts.
   */
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
    /** Accepted Newton updates; null on candidate completion, whose count belongs to meet-end. */
    iteration: number | null;
    /** Actual branch or termination reason. */
    reason: Reason;
    /** How the existing foot initialization chose the host chart. */
    initial?: "warm-foot" | "cold-foot" | "coarse";
  }

  /**
   * A synchronous nonthrowing value observer.
   * @evidence contracts/development/design.md#principled-representation Observes a detached state without supplying a new search input.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One value argument and no result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Cannot replace the meeting or alter candidate order through its return.
   * @evidence contracts/development/common.md#meaningful-documentation States synchronous nonthrowing ownership.
   */
  export type Sink = (event: IEvent) => void;
}
