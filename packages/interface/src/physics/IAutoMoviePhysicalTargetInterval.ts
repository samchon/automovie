import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";

/**
 * Causal fitted-pose intervals on cached and native simulation clocks.
 *
 * @evidence contracts/development/design.md#principled-representation Each plan retains its start poses and endpoint poses; a same-step revision samples the completed prefix at the preceding native boundary.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Clock identity and pose records are sufficient for checkpoint continuation; compiled samplers remain outside this record. AutoMoviePhysicalTargetInterval.plan retains initial/endpoint pose records and reuses the previous fitted plan's completed prefix.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The planner relies on admitted positive rates, nonempty intervals and complete bone coverage; a revision does not rewrite already completed history.
 * @evidence contracts/development/common.md#meaningful-documentation The endpoint is step/rate in local seconds; from and targets may retain borrowed records and are not deep snapshots. Explains same-step revision, prior-step continuity and fallback to initial poses.
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
    from: Record<string, IAutoMovieRigidTransform>;

    /** Fitted world bone poses at the complete cached interval end. */
    targets: Record<string, IAutoMovieRigidTransform>;
  }

  /**
   * Retain the completed prefix when an in-interval policy revision changes its future goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains same-step revision, prior-step continuity and fallback to initial poses.
   * @evidence contracts/development/design.md#principled-representation step/rate gives cache end seconds; nativeRate locates the completed integer tick, while all poses remain world rigid transforms.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMoviePhysicalTargetInterval.plan retains initial/endpoint pose records and reuses the previous fitted plan's completed prefix.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Clock validity and bone completeness remain caller premises; a noncontiguous prior plan does not invent a completed reference.
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
    initial: Record<string, IAutoMovieRigidTransform>;

    /**
     * Fitted world endpoint poses retained by reference. Every target bone must
     * have a start pose; the planner does not admit clock or bone completeness.
     */
    targets: Record<string, IAutoMovieRigidTransform>;
  };
}
