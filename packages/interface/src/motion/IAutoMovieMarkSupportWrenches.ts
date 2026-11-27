import type { IAutoMoviePhysicalSupportWrench } from "../physics/IAutoMoviePhysicalSupportWrench";

/**
 * Inputs for drawing the support force a physical controller allocated before
 * native integration.
 */
export namespace IAutoMovieMarkSupportWrenches {
  /**
   * Turn the support wrenches governing one second into inspection marks.
   *
   * A body's wrench governs `seconds` when it is the body's latest record at or
   * before `seconds` and `seconds` lies within one cache `interval` of it,
   * because the controller allocates it before integrating that step. Its
   * allocated force is drawn from the recorded centre of mass; a residual force
   * beyond the allocator's admitted optimisation error is drawn, flagged, from
   * the allocated arrow's tip, so the two arrows sum to the requested force.
   * These are motor-demand diagnostics, not achieved load: contact receipts
   * measure the force a floor actually transferred.
   */
  export type IProps = {
    /**
     * Borrowed wrench records of a physics cache or playback, ordered by time
     * per body. Empty input returns no marks.
     */
    wrenches: readonly IAutoMoviePhysicalSupportWrench[];
    /**
     * Drawn local film second on the wrenches' clock. A record governs from its
     * instant (with 1e-9-second tolerance) until, but not including, its
     * instant plus `interval`.
     */
    seconds: number;
    /**
     * Cache step each record governs, seconds: the reciprocal of the cache
     * rate; markSupportWrenches rejects nonfinite or nonpositive
     * values.
     */
    interval: number;
    /**
     * Arrow length per newton, metres/newton; markSupportWrenches
     * rejects nonfinite or nonpositive values.
     */
    metresPerNewton: number;
  };
}
