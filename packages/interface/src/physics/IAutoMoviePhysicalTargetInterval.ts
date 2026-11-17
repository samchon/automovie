import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Causal fitted-pose intervals on cached and native simulation clocks.
 *
 * @evidence contracts/development/design.md#principled-representation Each plan retains its start poses and endpoint poses; a same-step revision samples the completed prefix at the preceding native boundary.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Checkpointable pose data and clock indices are separate from engine-owned weak sampler caches and executable closures.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The planner relies on admitted positive rates, nonempty intervals and complete bone coverage; a revision does not rewrite already completed history.
 * @evidence contracts/development/common.md#meaningful-documentation Members define local seconds, interval/tick rates, prior-plan selection and pose references retained without cloning.
 */
export namespace IAutoMoviePhysicalTargetInterval {
  /**
   * A causal plan ends at step/rate; a revision starts at the preceding integer native boundary.
   *
   * @evidence contracts/development/design.md#principled-representation Start and endpoint world poses share one causal interval, including a shortened remainder after policy revision.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Clock identity and pose records are sufficient for checkpoint continuation; compiled samplers remain outside this record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The plan carries requested poses rather than measured body state; caller admission owns bone completeness and valid nonzero duration.
   * @evidence contracts/development/common.md#meaningful-documentation The endpoint is step/rate in local seconds; from and targets may retain borrowed records and are not deep snapshots.
   */
  export interface IPlan {
    /** Cached interval index; its ending clock is step divided by the declared cache rate. */
    step: number;

    /** Recovery-policy revision used to fit this plan; a new revision invalidates its remaining future. */
    revision: number;

    /** Local seconds at this plan's start on the declared integer native-tick grid. */
    start: number;

    /** Coherent world bone poses at start, retaining the completed prefix when a revision replans. */
    from: Record<string, IAutoMoviePhysicalProfile.ITransform>;

    /** Fitted world bone poses at the complete cached interval end. */
    targets: Record<string, IAutoMoviePhysicalProfile.ITransform>;
  }

  /**
   * Retain the completed prefix when an in-interval policy revision changes its future goal.
   */
  export type IPlanInput = {
    /** Cached interval index; the endpoint occurs at step/rate local seconds. */
    step: number;

    /** Recovery-policy revision recorded on the new plan; the caller decides replanning. */
    revision: number;

    /** Current local seconds; same-step revision starts one rounded native tick earlier. */
    seconds: number;

    /** Positive finite cached intervals per second; caller ensures a nonempty interval. */
    rate: number;

    /** Positive finite native ticks per second used to retain a completed prefix. */
    nativeRate: number;

    /**
     * Prior plan: same-step is sampled at the new start, preceding-step contributes
     * its targets directly, and any other/missing step falls back to initial.
     */
    previous?: IAutoMoviePhysicalTargetInterval.IPlan;

    /** World bone poses used by reference when no contiguous prior plan is available. */
    initial: Record<string, IAutoMoviePhysicalProfile.ITransform>;

    /**
     * Fitted world endpoint poses retained by reference. Every target bone must
     * have a start pose; the planner does not admit clock or bone completeness.
     */
    targets: Record<string, IAutoMoviePhysicalProfile.ITransform>;
  };
}
