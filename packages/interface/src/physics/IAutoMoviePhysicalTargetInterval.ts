import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";

/** Causal fitted-pose intervals on cached and native simulation clocks. */
export namespace IAutoMoviePhysicalTargetInterval {
  /**
   * A causal plan ends at step/rate; a revision starts at the preceding integer
   * native boundary.
   */
  export interface IPlan {
    /**
     * Cached interval index; its ending clock is step divided by the declared
     * cache rate.
     */
    step: number;

    /**
     * Recovery-policy revision used to fit this plan; a new revision
     * invalidates its remaining future.
     */
    revision: number;

    /**
     * Local seconds at this plan's start on the declared integer native-tick
     * grid.
     */
    start: number;

    /**
     * Coherent world bone poses at start, retaining the completed prefix when a
     * revision replans.
     */
    from: Record<string, IAutoMovieRigidTransform>;

    /** Fitted world bone poses at the complete cached interval end. */
    targets: Record<string, IAutoMovieRigidTransform>;
  }

  /**
   * Retain the completed prefix when an in-interval policy revision changes its
   * future goal.
   */
  export type IPlanInput = {
    /** Cached interval index; the endpoint occurs at step/rate local seconds. */
    step: number;

    /**
     * Recovery-policy revision recorded on the new plan; the caller decides
     * replanning.
     */
    revision: number;

    /**
     * Current local seconds; same-step revision starts one rounded native tick
     * earlier.
     */
    seconds: number;

    /**
     * Positive finite cached intervals per second; caller ensures a nonempty
     * interval.
     */
    rate: number;

    /**
     * Positive finite native ticks per second used to retain a completed
     * prefix.
     */
    nativeRate: number;

    /**
     * Prior plan: same-step is sampled at the new start, preceding-step
     * contributes its targets directly, and any other/missing step falls back
     * to initial.
     */
    previous?: IAutoMoviePhysicalTargetInterval.IPlan;

    /**
     * World bone poses used by reference when no contiguous prior plan is
     * available.
     */
    initial: Record<string, IAutoMovieRigidTransform>;

    /**
     * Fitted world endpoint poses retained by reference. Every target bone must
     * have a start pose; the planner does not admit clock or bone
     * completeness.
     */
    targets: Record<string, IAutoMovieRigidTransform>;
  };
}
