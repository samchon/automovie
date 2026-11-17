

/**
 * Sampled root-lowering request accompanying coherent fitted pose/twist targets.
 *
 * @evidence contracts/development/design.md#principled-representation Root lowering is interpolated over the same remaining causal interval as fitted poses; its signed derivative uses that interval's duration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the scalar lowering and derivative escape; the engine owns transient plan caches and updates the caller's target-goal map.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Revision replanning preserves completed history rather than restarting a full interval, and the request does not claim actual root displacement.
 * @evidence contracts/development/common.md#meaningful-documentation The result distinguishes positive-down metres from signed metres per second on the local interval clock.
 */
export namespace IAutoMovieTrackPhysicalBalanceTargets {
  /**
   * Balance owns a coherent support posture independently of optional Cartesian endpoint actuators. Fitted interval poses and twists travel together; actual stationary stance takes priority over an incompatible authored-root posture.
   */
  export type IResult = {
    /** Interpolated positive-down root lowering request in metres at the current local time. */
    rootDrop: number;
    /** Signed change in lowering per second across the plan's remaining interval, in m/s. */
    rootDropVelocity: number;
  };
}
